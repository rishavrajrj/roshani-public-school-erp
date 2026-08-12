-- Migration 021: Link Auth users to profiles by matching email & full_name
UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'superadmin@roshanischool.com' AND p.full_name = 'Vijay Kumar';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'admin@roshanischool.com' AND p.full_name = 'Priya Sharma';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'principal@roshanischool.com' AND p.full_name = 'Dr. Ramesh Gupta';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'teacher@roshanischool.com' AND p.full_name = 'Sunita Devi';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'accountant@roshanischool.com' AND p.full_name = 'Manoj Verma';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'parent@roshanischool.com' AND p.full_name = 'Rajesh Kumar';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'student@roshanischool.com' AND p.full_name = 'Arjun Kumar';

UPDATE public.profiles p
SET auth_user_id = u.id
FROM auth.users u
WHERE u.email = 'disabled@roshanischool.com' AND p.full_name = 'Disabled User Profile';
