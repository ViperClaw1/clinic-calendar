-- Sign-up is public, so a new user gets the least privilege that opens the app:
-- reference data only, no patients or appointments. An admin promotes them in clinic_members.

create function private.add_new_user_as_viewer() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.clinic_members (user_id, role) values (new.id, 'viewer')
    on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.add_new_user_as_viewer() from public;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.add_new_user_as_viewer();

-- Users who registered before this migration.
insert into public.clinic_members (user_id, role)
  select id, 'viewer' from auth.users
  on conflict (user_id) do nothing;

-- "Any member" would now include every self-registered user.
drop policy read_patients on public.patients;
create policy read_patients on public.patients for select to authenticated
  using (private.is_staff() or private.member_role() = 'physician');
