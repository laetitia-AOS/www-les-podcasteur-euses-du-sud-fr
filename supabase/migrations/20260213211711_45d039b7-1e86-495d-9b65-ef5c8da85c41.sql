
-- Add geographic columns to podcasts table
ALTER TABLE public.podcasts
  ADD COLUMN IF NOT EXISTS department_code text,
  ADD COLUMN IF NOT EXISTS department_label text,
  ADD COLUMN IF NOT EXISTS city_name text,
  ADD COLUMN IF NOT EXISTS city_insee_code text,
  ADD COLUMN IF NOT EXISTS city_postcode text;
