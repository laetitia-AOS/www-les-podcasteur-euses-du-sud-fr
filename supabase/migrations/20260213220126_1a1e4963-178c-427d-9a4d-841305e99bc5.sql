
-- Add new columns to podcasts table
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS telephone text;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS niveau_avancement text;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS frequence_publication text;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS priorite_actuelle text;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS consent_contact boolean NOT NULL DEFAULT false;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS consent_mise_en_relation boolean NOT NULL DEFAULT false;
