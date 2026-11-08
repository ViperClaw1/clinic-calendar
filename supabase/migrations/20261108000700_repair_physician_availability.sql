-- Migration 00100 was extended after some databases had already applied it, and those never got
-- its later statements. Idempotent, so it is safe on a database that has them.

do $$
begin
  if not exists (
    select from pg_catalog.pg_constraint
    where conname = 'physician_availability_physician_id_fkey'
      and conrelid = 'public.physician_availability'::regclass
  ) then
    alter table public.physician_availability
      add constraint physician_availability_physician_id_fkey
      foreign key (physician_id) references public.physicians on delete cascade;
  end if;
end;
$$;

create or replace function public.set_physician_availability(
  p_physician_id uuid,
  p_location_id uuid,
  p_ranges jsonb -- [{ "weekday": 1, "start_time": "09:00", "end_time": "12:00" }]
) returns void
language plpgsql set search_path = ''
as $$
begin
  delete from public.physician_availability
    where physician_id = p_physician_id and location_id = p_location_id;
  insert into public.physician_availability (physician_id, location_id, weekday, start_time, end_time)
    select p_physician_id, p_location_id, r.weekday, r.start_time, r.end_time
    from pg_catalog.jsonb_to_recordset(p_ranges) as r (weekday smallint, start_time time, end_time time);
end;
$$;

revoke all on function public.set_physician_availability(uuid, uuid, jsonb) from public, anon;
grant execute on function public.set_physician_availability(uuid, uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
