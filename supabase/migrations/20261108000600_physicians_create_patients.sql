-- A physician books new patients for themselves, so they may add them. Updates stay with staff.
drop policy insert_patients on public.patients;
create policy insert_patients on public.patients for insert to authenticated
  with check (private.is_staff() or private.member_role() = 'physician');
