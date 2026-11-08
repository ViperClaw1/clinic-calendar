-- ADR-0001: schema, invariants, RLS, audit. One clinic per deployment.

create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;

create schema private;

create type public.member_role as enum ('admin', 'receptionist', 'physician');
create type public.appointment_status as enum ('confirmed', 'pending', 'cancelled', 'completed', 'no-show');
create type public.timerange as range (subtype = time);

create function private.is_timezone(tz text) returns boolean
language sql stable set search_path = ''
as $$ select exists (select from pg_catalog.pg_timezone_names where name = tz) $$;

-- Tables ---------------------------------------------------------------------

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  timezone text not null check (private.is_timezone(timezone))
);

create table public.physicians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  avatar_url text
);

create table public.physician_locations (
  physician_id uuid not null references public.physicians on delete cascade,
  location_id uuid not null references public.locations on delete cascade,
  primary key (physician_id, location_id)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  date_of_birth date
);

create table public.appointment_types (
  name text primary key
);

create table public.clinic_members (
  user_id uuid primary key references auth.users on delete cascade,
  role public.member_role not null,
  physician_id uuid unique references public.physicians,
  check (role <> 'physician' or physician_id is not null)
);

create table public.physician_availability (
  id uuid primary key default gen_random_uuid(),
  physician_id uuid not null,
  location_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday, as Date.getDay()
  start_time time not null,
  end_time time not null,
  check (end_time > start_time),
  foreign key (physician_id, location_id) references public.physician_locations on delete cascade,
  -- A physician cannot be in two places at once, hence no location_id here.
  exclude using gist (
    physician_id with =,
    weekday with =,
    public.timerange(start_time, end_time) with &&
  )
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients,
  physician_id uuid not null references public.physicians,
  location_id uuid not null references public.locations,
  type text not null references public.appointment_types on update cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  notes text,
  check (ends_at - starts_at in (
    interval '15 min', interval '30 min', interval '45 min', interval '60 min', interval '90 min'
  )),
  exclude using gist (
    physician_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status not in ('cancelled', 'no-show'))
);

create index appointments_starts_at_idx on public.appointments (starts_at);
create index appointments_patient_id_idx on public.appointments (patient_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id uuid not null,
  action text not null,
  actor uuid default auth.uid(), -- no FK: the trail must outlive the user
  at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

-- Invariants -----------------------------------------------------------------

-- SQLSTATE CA001 = outside the physician's availability; the client maps it to a toast.
create function private.check_appointment_availability() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  tz text;
  local_start timestamp;
  local_end timestamp;
  available boolean;
begin
  -- A status or notes change must keep working after the schedule changes.
  if tg_op = 'UPDATE'
     and (new.physician_id, new.location_id, new.starts_at, new.ends_at)
         is not distinct from (old.physician_id, old.location_id, old.starts_at, old.ends_at) then
    return new;
  end if;

  select timezone into strict tz from public.locations where id = new.location_id;
  local_start := new.starts_at at time zone tz;
  local_end := new.ends_at at time zone tz;

  -- Also covers a DST fall-back, where local end can precede local start.
  if local_start::date <> local_end::date or local_end <= local_start then
    raise exception 'appointment must fit within one local day' using errcode = 'CA001';
  end if;

  -- range_agg merges adjacent ranges, so 09:00-12:00 + 12:00-17:00 accepts 11:45-12:15.
  select coalesce(
    pg_catalog.range_agg(public.timerange(a.start_time, a.end_time))
      @> public.timerange(local_start::time, local_end::time),
    false)
  into available
  from public.physician_availability a
  where a.physician_id = new.physician_id
    and a.location_id = new.location_id
    and a.weekday = extract(dow from local_start);

  if not available then
    raise exception 'physician is not available at this time' using errcode = 'CA001';
  end if;
  return new;
end;
$$;

create trigger appointments_check_availability
  before insert or update on public.appointments
  for each row execute function private.check_appointment_availability();

-- Audit ----------------------------------------------------------------------

create function private.write_audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_log (table_name, row_id, action, old_data, new_data)
  values (
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    tg_op,
    case when tg_op <> 'INSERT' then pg_catalog.to_jsonb(old) end,
    case when tg_op <> 'DELETE' then pg_catalog.to_jsonb(new) end
  );
  return null;
end;
$$;

create trigger appointments_audit after insert or update or delete on public.appointments
  for each row execute function private.write_audit();
create trigger patients_audit after insert or update or delete on public.patients
  for each row execute function private.write_audit();

-- Access helpers: security definer, otherwise the clinic_members policy recurses.

create function private.member_role() returns public.member_role
language sql stable security definer set search_path = ''
as $$ select role from public.clinic_members where user_id = auth.uid() $$;

create function private.member_physician_id() returns uuid
language sql stable security definer set search_path = ''
as $$ select physician_id from public.clinic_members where user_id = auth.uid() $$;

create function private.is_staff() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(private.member_role() in ('admin', 'receptionist'), false) $$;

revoke all on schema private from public;
revoke all on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on function
  private.member_role(), private.member_physician_id(), private.is_staff()
  to authenticated;

-- Privileges: Supabase grants everything by default, and RLS does not stop TRUNCATE.

revoke all on all tables in schema public from anon, authenticated;

grant select on public.locations, public.physicians, public.physician_locations,
  public.appointment_types, public.physician_availability to authenticated;
grant insert, update, delete on public.locations, public.physicians, public.physician_locations,
  public.appointment_types, public.physician_availability to authenticated;
grant select, insert, update on public.patients, public.appointments to authenticated;
grant select on public.clinic_members, public.audit_log to authenticated;
grant insert, update, delete on public.clinic_members to authenticated;

-- RLS ------------------------------------------------------------------------

alter table public.locations enable row level security;
alter table public.physicians enable row level security;
alter table public.physician_locations enable row level security;
alter table public.appointment_types enable row level security;
alter table public.physician_availability enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.clinic_members enable row level security;
alter table public.audit_log enable row level security;

-- Reference data: readable by every member, editable by admin.
create policy read_members on public.locations for select to authenticated
  using (private.member_role() is not null);
create policy write_admin on public.locations for all to authenticated
  using (private.member_role() = 'admin') with check (private.member_role() = 'admin');

create policy read_members on public.physicians for select to authenticated
  using (private.member_role() is not null);
create policy write_admin on public.physicians for all to authenticated
  using (private.member_role() = 'admin') with check (private.member_role() = 'admin');

create policy read_members on public.physician_locations for select to authenticated
  using (private.member_role() is not null);
create policy write_admin on public.physician_locations for all to authenticated
  using (private.member_role() = 'admin') with check (private.member_role() = 'admin');

create policy read_members on public.appointment_types for select to authenticated
  using (private.member_role() is not null);
create policy write_admin on public.appointment_types for all to authenticated
  using (private.member_role() = 'admin') with check (private.member_role() = 'admin');

create policy read_members on public.physician_availability for select to authenticated
  using (private.member_role() is not null);
create policy write_admin on public.physician_availability for all to authenticated
  using (private.member_role() = 'admin') with check (private.member_role() = 'admin');

-- Appointments: staff see all, a physician sees and updates only their own.
-- No DELETE grant: cancelling is status = 'cancelled'.
create policy read_appointments on public.appointments for select to authenticated
  using (private.is_staff() or physician_id = private.member_physician_id());
create policy insert_appointments on public.appointments for insert to authenticated
  with check (private.is_staff());
create policy update_appointments on public.appointments for update to authenticated
  using (private.is_staff() or physician_id = private.member_physician_id())
  with check (private.is_staff() or physician_id = private.member_physician_id());

-- Definer: reading appointments here must not re-enter their policies per row.
create function private.is_my_patient(p_patient_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select from public.appointments a
    where a.patient_id = p_patient_id
      and a.physician_id = private.member_physician_id()
  )
$$;
revoke all on function private.is_my_patient(uuid) from public;
grant execute on function private.is_my_patient(uuid) to authenticated;

create policy read_patients on public.patients for select to authenticated
  using (private.is_staff() or private.is_my_patient(id));
create policy insert_patients on public.patients for insert to authenticated
  with check (private.is_staff());
create policy update_patients on public.patients for update to authenticated
  using (private.is_staff()) with check (private.is_staff());

create policy read_members on public.clinic_members for select to authenticated
  using (user_id = auth.uid() or private.member_role() = 'admin');
create policy write_admin on public.clinic_members for all to authenticated
  using (private.member_role() = 'admin') with check (private.member_role() = 'admin');

create policy read_admin on public.audit_log for select to authenticated
  using (private.member_role() = 'admin');

-- Realtime: clients only invalidate on events, RLS filters the rows.
alter publication supabase_realtime add table public.appointments;
