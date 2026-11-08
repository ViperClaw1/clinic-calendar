-- Staff edit any schedule, a physician edits their own; a physician may book for themselves.

create policy write_schedule on public.physician_availability for all to authenticated
  using (private.is_staff() or physician_id = private.member_physician_id())
  with check (private.is_staff() or physician_id = private.member_physician_id());

drop policy write_admin on public.physician_availability;

drop policy insert_appointments on public.appointments;
create policy insert_appointments on public.appointments for insert to authenticated
  with check (private.is_staff() or physician_id = private.member_physician_id());

-- Replaces one physician's schedule at one location in a single transaction,
-- so a rejected range cannot leave the schedule deleted. RLS still applies (invoker).
create function public.set_physician_availability(
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

-- Lets PostgREST embed availability in physicians; the composite FK alone points at physician_locations.
alter table public.physician_availability
  add constraint physician_availability_physician_id_fkey
  foreign key (physician_id) references public.physicians on delete cascade;
