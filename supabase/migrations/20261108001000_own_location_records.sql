-- A physician adds the places they practice at. created_by is the owner;
-- clinic locations from seed stay null and remain admin-managed.
-- Removing a location cascades through physician_locations to that physician's hours.

alter table public.locations
  add column created_by uuid references auth.users on delete set null;

create policy insert_own on public.locations for insert to authenticated
  with check (private.member_role() = 'physician' and created_by = auth.uid());

create policy update_own on public.locations for update to authenticated
  using (private.member_role() = 'physician' and created_by = auth.uid())
  with check (private.member_role() = 'physician' and created_by = auth.uid());

create policy delete_own on public.locations for delete to authenticated
  using (private.member_role() = 'physician' and created_by = auth.uid());

-- The new place is immediately one the physician can schedule at.
create function private.link_owned_location() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  pid uuid := private.member_physician_id();
begin
  if pid is not null and new.created_by is not distinct from auth.uid() then
    insert into public.physician_locations (physician_id, location_id)
    values (pid, new.id)
    on conflict do nothing;
  end if;
  return null;
end;
$$;

revoke all on function private.link_owned_location() from public, anon, authenticated;

create trigger locations_link_owner
  after insert on public.locations
  for each row execute function private.link_owned_location();
