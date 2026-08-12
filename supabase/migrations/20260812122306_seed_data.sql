-- Migration 014: Development Seed Data (ALL FICTIONAL)
-- NOTE: All data below is fictional/placeholder. Replace with real values before production.

INSERT INTO public.schools (id, name, code, address, city, state, country, phone, email, website)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Roshani Public School',
  'RPS',
  'Roshani Nagar, State Highway 54, Turkauliya',
  'East Champaran',
  'Bihar',
  'India',
  '+919472405097',
  'roshanipublicschoolturkauliya1@gmail.com',
  'https://roshanipublicschool.com'
);

INSERT INTO public.school_settings (school_id, key, value) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'timezone', '"Asia/Kolkata"'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'currency', '"INR"'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'academic_year_start_month', '4'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'cbse_affiliation_number', '"000000-PLACEHOLDER"'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'seed_data_notice', '"All seed data is fictional or placeholder. Replace with real values before production use."');

INSERT INTO public.academic_sessions (id, school_id, name, start_date, end_date, is_current, status)
VALUES ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-27', '2026-04-01', '2027-03-31', true, 'active');

INSERT INTO public.classes (id, school_id, name, display_order, status) VALUES
  ('c100bc99-0001-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nursery', 1, 'active'),
  ('c100bc99-0002-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'LKG', 2, 'active'),
  ('c100bc99-0003-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'UKG', 3, 'active'),
  ('c100bc99-0004-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 1', 4, 'active'),
  ('c100bc99-0005-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 2', 5, 'active'),
  ('c100bc99-0006-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 3', 6, 'active'),
  ('c100bc99-0007-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 4', 7, 'active'),
  ('c100bc99-0008-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 5', 8, 'active'),
  ('c100bc99-0009-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 6', 9, 'active'),
  ('c100bc99-000a-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 7', 10, 'active'),
  ('c100bc99-000b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 8', 11, 'active'),
  ('c100bc99-000c-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 9', 12, 'active'),
  ('c100bc99-000d-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 10', 13, 'active'),
  ('c100bc99-000e-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 11', 14, 'active'),
  ('c100bc99-000f-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Class 12', 15, 'active');

INSERT INTO public.sections (school_id, class_id, name, capacity, status)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', c.id, s.name, 40, 'active'
FROM public.classes c
CROSS JOIN (VALUES ('A'), ('B')) AS s(name)
WHERE c.school_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

INSERT INTO public.roles (id, name, description) VALUES
  ('d100bc99-0001-4ef8-bb6d-6bb9bd380a11', 'Super Admin', 'System-wide super administrator'),
  ('d100bc99-0002-4ef8-bb6d-6bb9bd380a11', 'Admin', 'School administrator'),
  ('d100bc99-0003-4ef8-bb6d-6bb9bd380a11', 'Principal', 'School principal'),
  ('d100bc99-0004-4ef8-bb6d-6bb9bd380a11', 'Accountant', 'School accountant'),
  ('d100bc99-0005-4ef8-bb6d-6bb9bd380a11', 'Teacher', 'School teacher'),
  ('d100bc99-0006-4ef8-bb6d-6bb9bd380a11', 'Parent', 'Parent or guardian'),
  ('d100bc99-0007-4ef8-bb6d-6bb9bd380a11', 'Student', 'Student');

INSERT INTO public.subjects (id, school_id, name, code, display_order, status) VALUES
  ('e100bc99-0001-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Mathematics', 'MATH', 1, 'active'),
  ('e100bc99-0002-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'English', 'ENG', 2, 'active'),
  ('e100bc99-0003-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Hindi', 'HIN', 3, 'active'),
  ('e100bc99-0004-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Science', 'SCI', 4, 'active'),
  ('e100bc99-0005-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Social Science', 'SSC', 5, 'active'),
  ('e100bc99-0006-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Computer', 'COMP', 6, 'active');

INSERT INTO public.guardians (id, school_id, full_name, relationship, phone, email, address, occupation, status) VALUES
  ('f100bc99-0001-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rajesh Kumar Sharma', 'father', '+919876543210', 'rajesh.sharma.test@example.com', 'Turkauliya, East Champaran', 'Business Owner', 'active'),
  ('f100bc99-0002-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sunita Devi', 'mother', '+919876543211', 'sunita.devi.test@example.com', 'Turkauliya, East Champaran', 'Teacher', 'active'),
  ('f100bc99-0003-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Amit Kumar Singh', 'father', '+919876543212', 'amit.singh.test@example.com', 'Motihari, East Champaran', 'Government Employee', 'active');

INSERT INTO public.students (id, school_id, admission_number, first_name, last_name, date_of_birth, gender, address, city, state, status) VALUES
  ('f200bc99-0001-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'RPS-2026-001', 'Arjun', 'Sharma', '2015-06-15', 'male', 'Turkauliya', 'East Champaran', 'Bihar', 'active'),
  ('f200bc99-0002-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'RPS-2026-002', 'Priya', 'Sharma', '2017-03-22', 'female', 'Turkauliya', 'East Champaran', 'Bihar', 'active'),
  ('f200bc99-0003-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'RPS-2026-003', 'Rahul', 'Singh', '2014-11-08', 'male', 'Motihari', 'East Champaran', 'Bihar', 'active'),
  ('f200bc99-0004-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'RPS-2026-004', 'Ananya', 'Singh', '2016-01-30', 'female', 'Motihari', 'East Champaran', 'Bihar', 'active'),
  ('f200bc99-0005-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'RPS-2026-005', 'Vikash', 'Yadav', '2013-09-12', 'male', 'Turkauliya', 'East Champaran', 'Bihar', 'active');

INSERT INTO public.student_guardians (student_id, guardian_id, school_id, relationship, is_primary) VALUES
  ('f200bc99-0001-4ef8-bb6d-6bb9bd380a11', 'f100bc99-0001-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'father', true),
  ('f200bc99-0001-4ef8-bb6d-6bb9bd380a11', 'f100bc99-0002-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'mother', false),
  ('f200bc99-0002-4ef8-bb6d-6bb9bd380a11', 'f100bc99-0001-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'father', true),
  ('f200bc99-0002-4ef8-bb6d-6bb9bd380a11', 'f100bc99-0002-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'mother', false),
  ('f200bc99-0003-4ef8-bb6d-6bb9bd380a11', 'f100bc99-0003-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'father', true),
  ('f200bc99-0004-4ef8-bb6d-6bb9bd380a11', 'f100bc99-0003-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'father', true);
