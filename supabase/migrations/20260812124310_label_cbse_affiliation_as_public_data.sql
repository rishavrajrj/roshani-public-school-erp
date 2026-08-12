-- Migration 016: Replace CBSE affiliation number with fictional placeholder
UPDATE public.school_settings
SET value = '"000000-PLACEHOLDER"'
WHERE school_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  AND key = 'cbse_affiliation_number';

INSERT INTO public.school_settings (school_id, key, value)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'seed_data_notice',
  '"All seed data is fictional or placeholder. Replace with real values before production use."'
)
ON CONFLICT (school_id, key) DO NOTHING;
