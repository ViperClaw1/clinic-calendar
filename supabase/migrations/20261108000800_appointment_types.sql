-- Reference data every environment needs; seed.sql does not reach hosted databases.
insert into public.appointment_types (name) values
  ('Annual Checkup'), ('Follow-up'), ('Consultation'), ('Wellness Visit'), ('Lab Results Review'),
  ('Vaccination'), ('Comprehensive Exam'), ('Cardiac Evaluation'), ('Physical Therapy'), ('Mental Health')
on conflict (name) do nothing;
