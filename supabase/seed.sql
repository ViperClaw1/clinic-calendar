-- Fictional dev data, ported from src/data/mockData.ts. Timezone is a placeholder.

insert into public.locations (id, name, address, timezone) values
  ('00000000-0000-0000-0000-00000000a001', 'Downtown Medical Center', '123 Main St, Suite 100', 'America/New_York'),
  ('00000000-0000-0000-0000-00000000a002', 'Westside Clinic', '456 Oak Ave', 'America/New_York'),
  ('00000000-0000-0000-0000-00000000a003', 'North Health Campus', '789 Pine Blvd', 'America/New_York');

insert into public.physicians (id, name, specialty) values
  ('00000000-0000-0000-0000-00000000b001', 'Dr. Sarah Chen', 'Family Medicine'),
  ('00000000-0000-0000-0000-00000000b002', 'Dr. Michael Roberts', 'Internal Medicine'),
  ('00000000-0000-0000-0000-00000000b003', 'Dr. Emily Watson', 'Pediatrics'),
  ('00000000-0000-0000-0000-00000000b004', 'Dr. James Kim', 'Cardiology');

insert into public.physician_locations (physician_id, location_id) values
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a001'),
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a002'),
  ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000a001'),
  ('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-00000000a002'),
  ('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-00000000a003'),
  ('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-00000000a001'),
  ('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-00000000a003');

-- The mock had no per-location schedule; each physician's weekdays are split between locations.
with shapes (shape, start_time, end_time) as (values
  ('full', time '08:00', time '12:00'),
  ('full', time '13:00', time '21:00'),
  ('morning', time '08:00', time '13:00'),
  ('afternoon', time '13:00', time '21:00')
), schedule (physician, location, weekday, shape) as (values
  ('b001', 'a001', 1, 'full'), ('b001', 'a001', 2, 'full'), ('b001', 'a002', 3, 'morning'),
  ('b001', 'a001', 4, 'full'), ('b001', 'a002', 5, 'morning'),
  ('b002', 'a001', 1, 'morning'), ('b002', 'a001', 2, 'afternoon'), ('b002', 'a001', 3, 'full'),
  ('b002', 'a001', 4, 'afternoon'), ('b002', 'a001', 5, 'full'),
  ('b003', 'a002', 1, 'full'), ('b003', 'a002', 2, 'full'), ('b003', 'a003', 3, 'full'),
  ('b003', 'a003', 4, 'full'), ('b003', 'a002', 5, 'morning'),
  ('b004', 'a001', 1, 'afternoon'), ('b004', 'a003', 2, 'full'), ('b004', 'a001', 3, 'afternoon'),
  ('b004', 'a003', 4, 'full'), ('b004', 'a001', 5, 'afternoon')
)
insert into public.physician_availability (physician_id, location_id, weekday, start_time, end_time)
select ('00000000-0000-0000-0000-00000000' || s.physician)::uuid,
       ('00000000-0000-0000-0000-00000000' || s.location)::uuid,
       s.weekday, h.start_time, h.end_time
from schedule s join shapes h using (shape);

insert into public.patients (id, name, email, phone, date_of_birth) values
  ('00000000-0000-0000-0000-00000000c001', 'John Smith', 'john.smith@email.com', '(555) 123-4567', '1985-03-15'),
  ('00000000-0000-0000-0000-00000000c002', 'Maria Garcia', 'maria.garcia@email.com', '(555) 234-5678', '1990-07-22'),
  ('00000000-0000-0000-0000-00000000c003', 'David Johnson', 'david.j@email.com', '(555) 345-6789', '1978-11-08'),
  ('00000000-0000-0000-0000-00000000c004', 'Lisa Brown', 'lisa.brown@email.com', '(555) 456-7890', '1995-01-30'),
  ('00000000-0000-0000-0000-00000000c005', 'Robert Wilson', 'r.wilson@email.com', '(555) 567-8901', '1982-09-12'),
  ('00000000-0000-0000-0000-00000000c006', 'Jennifer Davis', 'j.davis@email.com', '(555) 678-9012', '1988-04-25'),
  ('00000000-0000-0000-0000-00000000c007', 'Michael Taylor', 'm.taylor@email.com', '(555) 789-0123', '1972-12-03'),
  ('00000000-0000-0000-0000-00000000c008', 'Amanda Martinez', 'a.martinez@email.com', '(555) 890-1234', '1993-06-18');

insert into public.appointment_types (name) values
  ('Annual Checkup'), ('Follow-up'), ('Consultation'), ('Wellness Visit'), ('Lab Results Review'),
  ('Vaccination'), ('Comprehensive Exam'), ('Cardiac Evaluation'), ('Physical Therapy'), ('Mental Health');

-- Appointments in the current week (day_offset 0 = Monday), so the calendar is never empty.
with week as (select date_trunc('week', now() at time zone 'America/New_York')::date as monday)
insert into public.appointments (patient_id, physician_id, location_id, type, starts_at, ends_at, status)
select ('00000000-0000-0000-0000-00000000' || v.patient)::uuid,
       ('00000000-0000-0000-0000-00000000' || v.physician)::uuid,
       ('00000000-0000-0000-0000-00000000' || v.location)::uuid,
       v.type,
       (monday + v.day_offset + v.start_time) at time zone 'America/New_York',
       (monday + v.day_offset + v.start_time + make_interval(mins => v.minutes)) at time zone 'America/New_York',
       v.status::public.appointment_status
from week, (values
  ('c001', 'b001', 'a001', 'Annual Checkup', 0, time '09:00', 30, 'confirmed'),
  ('c002', 'b001', 'a001', 'Follow-up', 0, time '10:30', 15, 'pending'),
  ('c003', 'b002', 'a001', 'Consultation', 1, time '14:00', 45, 'confirmed'),
  ('c004', 'b003', 'a002', 'Wellness Visit', 1, time '09:30', 30, 'confirmed'),
  ('c005', 'b004', 'a003', 'Cardiac Evaluation', 1, time '15:00', 60, 'pending'),
  ('c006', 'b001', 'a002', 'Lab Results Review', 2, time '08:00', 30, 'confirmed'),
  ('c007', 'b002', 'a001', 'Comprehensive Exam', 2, time '09:00', 90, 'confirmed'),
  ('c008', 'b003', 'a003', 'Vaccination', 3, time '10:00', 30, 'completed'),
  ('c001', 'b004', 'a003', 'Follow-up', 3, time '16:00', 45, 'no-show'),
  ('c002', 'b001', 'a002', 'Consultation', 4, time '09:00', 30, 'cancelled')
) as v (patient, physician, location, type, day_offset, start_time, minutes, status);
