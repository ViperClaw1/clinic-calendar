-- A physician books new patients for themselves, so every member reads the patient list.
-- Writes stay with staff.
drop policy read_patients on public.patients;
create policy read_patients on public.patients for select to authenticated
  using (private.member_role() is not null);
drop function private.is_my_patient(uuid);
