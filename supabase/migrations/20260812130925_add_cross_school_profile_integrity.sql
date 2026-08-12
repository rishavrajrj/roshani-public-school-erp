-- Migration 018: Enforce cross-school integrity for student/guardian → profile relationships
-- FIXES: students.profile_id and guardians.profile_id previously used simple FK to profiles(id)
-- which allowed cross-school linkage. Replace with composite FK (profile_id, school_id) → profiles(id, school_id).

-- 1. Drop existing simple FK on students.profile_id
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_profile_id_fkey;

-- 2. Add composite FK: students(profile_id, school_id) → profiles(id, school_id)
-- This guarantees student.school_id = profile.school_id at the database level
ALTER TABLE public.students
  ADD CONSTRAINT students_profile_school_fk
  FOREIGN KEY (profile_id, school_id)
  REFERENCES public.profiles(id, school_id);

-- 3. Drop existing simple FK on guardians.profile_id
ALTER TABLE public.guardians DROP CONSTRAINT IF EXISTS guardians_profile_id_fkey;

-- 4. Add composite FK: guardians(profile_id, school_id) → profiles(id, school_id)
-- This guarantees guardian.school_id = profile.school_id at the database level
ALTER TABLE public.guardians
  ADD CONSTRAINT guardians_profile_school_fk
  FOREIGN KEY (profile_id, school_id)
  REFERENCES public.profiles(id, school_id);
