
-- Add new columns for ecosystem directory
ALTER TABLE public.podcasts 
  ADD COLUMN IF NOT EXISTS type_profil text NOT NULL DEFAULT 'podcasteur',
  ADD COLUMN IF NOT EXISTS bio_750 text,
  ADD COLUMN IF NOT EXISTS lien_principal text,
  ADD COLUMN IF NOT EXISTS metier_principal text,
  ADD COLUMN IF NOT EXISTS services_3 text[],
  ADD COLUMN IF NOT EXISTS disponibilite text;
