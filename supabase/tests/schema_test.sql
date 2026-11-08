-- Invariants and RLS from ADR-0001. Run: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

-- Fixtures: America/New_York; 2030-03-10 is the DST start. Dates avoid clashing with seed.sql.
insert into auth.users (id, email) values
  ('11111111-0000-0000-0000-000000000001', 'admin@test.local'),
  ('11111111-0000-0000-0000-000000000002', 'reception@test.local'),
  ('11111111-0000-0000-0000-000000000003', 'doc-a@test.local'),
  ('11111111-0000-0000-0000-000000000004', 'doc-b@test.local'),
  ('11111111-0000-0000-0000-000000000005', 'stranger@test.local');

insert into public.locations (id, name, address, timezone) values
  ('22222222-0000-0000-0000-000000000001', 'L1', 'a', 'America/New_York'),
  ('22222222-0000-0000-0000-000000000002', 'L2', 'b', 'America/New_York');
insert into public.physicians (id, name, specialty) values
  ('33333333-0000-0000-0000-00000000000a', 'Doc A', 's'),
  ('33333333-0000-0000-0000-00000000000b', 'Doc B', 's');
insert into public.physician_locations values
  ('33333333-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-000000000001'),
  ('33333333-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-000000000002'),
  ('33333333-0000-0000-0000-00000000000b', '22222222-0000-0000-0000-000000000001');
insert into public.clinic_members (user_id, role, physician_id) values
  ('11111111-0000-0000-0000-000000000001', 'admin', null),
  ('11111111-0000-0000-0000-000000000002', 'receptionist', null),
  ('11111111-0000-0000-0000-000000000003', 'physician', '33333333-0000-0000-0000-00000000000a'),
  ('11111111-0000-0000-0000-000000000004', 'physician', '33333333-0000-0000-0000-00000000000b');
insert into public.patients (id, name, email, phone) values
  ('44444444-0000-0000-0000-00000000000a', 'Patient A', 'a@x', '1'),
  ('44444444-0000-0000-0000-00000000000b', 'Patient B', 'b@x', '2');
insert into public.appointment_types values ('Test Visit');

-- Monday availability, split into two adjacent ranges.
insert into public.physician_availability (physician_id, location_id, weekday, start_time, end_time) values
  ('33333333-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-000000000001', 1, '09:00', '12:00'),
  ('33333333-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-000000000001', 1, '12:00', '17:00'),
  ('33333333-0000-0000-0000-00000000000b', '22222222-0000-0000-0000-000000000001', 1, '09:00', '17:00');

create function pg_temp.book(id_ uuid, doc text, starts timestamptz, mins int, status_ text default 'confirmed')
returns void language sql as $$
  insert into public.appointments (id, patient_id, physician_id, location_id, type, starts_at, ends_at, status)
  values (id_, '44444444-0000-0000-0000-00000000000a', ('33333333-0000-0000-0000-00000000000' || doc)::uuid,
          '22222222-0000-0000-0000-000000000001', 'Test Visit', starts, starts + make_interval(mins => mins),
          status_::public.appointment_status)
$$;

-- 2030-01-07 is a Monday; New York is UTC-5.
select lives_ok($$ select pg_temp.book('55555555-0000-0000-0000-000000000001', 'a', '2030-01-07 15:00Z', 30) $$,
  'books inside availability');
select throws_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-01-07 15:15Z', 30) $$,
  '23P01', null, 'rejects an overlap for the same physician');
select lives_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-01-07 15:30Z', 30) $$,
  'allows a back-to-back appointment');
select lives_ok($$ select pg_temp.book('55555555-0000-0000-0000-00000000000b', 'b', '2030-01-07 15:00Z', 30) $$,
  'another physician may use the same time');
select lives_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-01-07 15:00Z', 30, 'cancelled') $$,
  'a cancelled appointment does not occupy the slot');
select lives_ok($$ select pg_temp.book('55555555-0000-0000-0000-000000000002', 'a', '2030-01-07 16:00Z', 30, 'cancelled') $$,
  'cancelled fixture');
select lives_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-01-07 16:00Z', 30) $$,
  'the slot of a cancelled appointment can be rebooked');
select throws_ok($$ update public.appointments set status = 'confirmed' where id = '55555555-0000-0000-0000-000000000002' $$,
  '23P01', null, 'reactivating into an occupied slot is rejected');
select throws_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-01-07 18:00Z', 20) $$,
  '23514', null, 'rejects a disallowed duration');
select throws_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-01-07 13:00Z', 30) $$,
  'CA001', null, 'rejects a time outside availability');
select throws_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-01-08 15:00Z', 30) $$,
  'CA001', null, 'rejects a day without availability');
select lives_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-01-07 16:45Z', 30) $$,
  'an appointment may span adjacent ranges (11:45-12:15 local)');
select throws_ok($$ insert into public.physician_availability (physician_id, location_id, weekday, start_time, end_time)
    values ('33333333-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-000000000002', 1, '16:00', '18:00') $$,
  '23P01', null, 'availability cannot overlap across locations');

-- DST: 09:00 local is 14:00Z before the switch and 13:00Z after it.
select throws_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-03-04 13:00Z', 30) $$,
  'CA001', null, '13:00Z is 08:00 local before DST');
select lives_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-03-11 13:00Z', 30) $$,
  '13:00Z is 09:00 local after DST');

-- A status change survives a schedule change; a move does not.
delete from public.physician_availability
  where physician_id = '33333333-0000-0000-0000-00000000000b';
select lives_ok($$ update public.appointments set status = 'completed' where id = '55555555-0000-0000-0000-00000000000b' $$,
  'status change ignores a changed schedule');
select throws_ok($$ update public.appointments set starts_at = starts_at + interval '1 hour', ends_at = ends_at + interval '1 hour'
    where id = '55555555-0000-0000-0000-00000000000b' $$,
  'CA001', null, 'moving is checked against the current schedule');

create function pg_temp.login(n int) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', '11111111-0000-0000-0000-00000000000' || n, 'role', 'authenticated')::text, true)
$$;
grant execute on all functions in schema pg_temp to authenticated, anon;

set local role authenticated;

-- Receptionist
select pg_temp.login(2);
select ok((select count(*) from public.appointments where starts_at > '2030-01-01') >= 2, 'receptionist sees all appointments');
select throws_ok($$ delete from public.appointments $$, '42501', null, 'nobody can delete appointments');
select throws_ok($$ truncate public.appointments $$, '42501', null, 'nobody can truncate appointments');
select is((select count(*) from public.audit_log), 0::bigint, 'receptionist cannot read the audit log');
select throws_ok($$ insert into public.audit_log (table_name, row_id, action) values ('x', gen_random_uuid(), 'x') $$,
  '42501', null, 'the audit log cannot be written by a client');
select throws_ok($$ insert into public.locations (name, address, timezone) values ('x', 'y', 'UTC') $$,
  '42501', null, 'receptionist cannot edit reference data');
select lives_ok($$ update public.patients set phone = '9' where id = '44444444-0000-0000-0000-00000000000b' $$,
  'receptionist can update a patient');

select lives_ok($$ select public.set_physician_availability('33333333-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-000000000002', '[{"weekday":2,"start_time":"09:00","end_time":"10:00"}]') $$,
  'staff can replace a schedule');
select throws_ok($$ select public.set_physician_availability('33333333-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-000000000002', '[{"weekday":1,"start_time":"16:00","end_time":"18:00"}]') $$,
  '23P01', null, 'a rejected schedule raises');
select is((select count(*) from public.physician_availability where location_id = '22222222-0000-0000-0000-000000000002' and weekday = 2), 1::bigint,
  'a rejected schedule keeps the previous one');

-- Physician B: owns only ...0b; patient B has no appointment with them.
select pg_temp.login(4);
select is((select count(*) from public.appointments
  where physician_id <> '33333333-0000-0000-0000-00000000000b'), 0::bigint, 'physician sees no foreign appointments');
select is((select count(*) from public.appointments), 1::bigint, 'physician sees their own appointment');
select is((select count(*) from public.patients where id = '44444444-0000-0000-0000-00000000000b'), 0::bigint,
  'physician cannot see a patient of nobody');
select is((select count(*) from public.patients where id = '44444444-0000-0000-0000-00000000000a'), 1::bigint,
  'physician sees their own patient');
select throws_ok($$ select pg_temp.book(gen_random_uuid(), 'a', '2030-02-04 15:00Z', 30) $$,
  '42501', null, 'physician cannot book for another physician');
select lives_ok($$ insert into public.physician_availability (physician_id, location_id, weekday, start_time, end_time)
    values ('33333333-0000-0000-0000-00000000000b', '22222222-0000-0000-0000-000000000001', 1, '09:00', '17:00') $$,
  'physician can edit their own schedule');
select throws_ok($$ insert into public.physician_availability (physician_id, location_id, weekday, start_time, end_time)
    values ('33333333-0000-0000-0000-00000000000a', '22222222-0000-0000-0000-000000000001', 2, '09:00', '17:00') $$,
  '42501', null, 'physician cannot edit a foreign schedule');
select lives_ok($$ select pg_temp.book(gen_random_uuid(), 'b', '2030-02-04 15:00Z', 30) $$,
  'physician can book for themselves');
update public.clinic_members set role = 'admin' where user_id = '11111111-0000-0000-0000-000000000004';
select is(private.member_role(), 'physician'::public.member_role, 'physician cannot promote themselves');

-- A signed-in user who is not a member sees nothing.
select pg_temp.login(5);
select is((select count(*) from public.patients), 0::bigint, 'non-member sees no patients');

-- Admin sees the trail, with the actor recorded.
select pg_temp.login(1);
select is((select actor from public.audit_log
    where table_name = 'patients' and action = 'UPDATE' order by id desc limit 1),
  '11111111-0000-0000-0000-000000000002'::uuid, 'audit log records the actor');

set local role anon;
select throws_ok($$ select * from public.patients $$, '42501', null, 'anon has no access to patients');
reset role;

select * from finish();
rollback;
