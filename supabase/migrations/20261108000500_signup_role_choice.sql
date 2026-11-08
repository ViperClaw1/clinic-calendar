-- MVP: the sign-up form lets the user choose receptionist or physician.
-- user metadata is client-controlled, so the role goes through a whitelist: admin cannot be self-granted.
-- ponytail: anyone who signs up gets patient data; replace with admin invitations before real PHI.

create or replace function private.add_new_user_as_viewer() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  chosen text := new.raw_user_meta_data ->> 'role';
  new_physician_id uuid;
begin
  if chosen = 'receptionist' then
    insert into public.clinic_members (user_id, role) values (new.id, 'receptionist')
      on conflict (user_id) do nothing;
  elsif chosen = 'physician' then
    insert into public.physicians (name, specialty)
      values (
        coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), new.email),
        coalesce(nullif(trim(new.raw_user_meta_data ->> 'specialty'), ''), 'General')
      )
      returning id into new_physician_id;
    -- Every location, so the schedule editor has somewhere to start.
    insert into public.physician_locations (physician_id, location_id)
      select new_physician_id, id from public.locations;
    insert into public.clinic_members (user_id, role, physician_id)
      values (new.id, 'physician', new_physician_id)
      on conflict (user_id) do nothing;
  else
    insert into public.clinic_members (user_id, role) values (new.id, 'viewer')
      on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;
