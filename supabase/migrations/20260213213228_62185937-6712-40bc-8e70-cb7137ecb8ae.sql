
ALTER TABLE public.podcasts
  ADD COLUMN IF NOT EXISTS besoins_podcast text[] DEFAULT '{}';
