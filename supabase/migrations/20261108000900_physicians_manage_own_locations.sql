-- A physician chooses their own locations in Settings. Removing one cascades to their hours there.
create policy insert_own on public.physician_locations for insert to authenticated
  with check (physician_id = private.member_physician_id());
create policy delete_own on public.physician_locations for delete to authenticated
  using (physician_id = private.member_physician_id());
