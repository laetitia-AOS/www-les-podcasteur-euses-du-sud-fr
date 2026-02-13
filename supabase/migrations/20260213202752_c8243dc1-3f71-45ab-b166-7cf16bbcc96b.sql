
-- Table des podcasts référencés
CREATE TABLE public.podcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_podcast TEXT NOT NULL,
  lien_ecoute TEXT NOT NULL,
  description TEXT NOT NULL,
  thematique TEXT,
  ville TEXT,
  type_podcast TEXT,
  monetise TEXT,
  besoin TEXT,
  prenom TEXT,
  nom TEXT,
  structure TEXT,
  email TEXT NOT NULL,
  vignette_url TEXT,
  valide BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut soumettre un podcast
CREATE POLICY "Anyone can submit a podcast"
ON public.podcasts FOR INSERT
WITH CHECK (true);

-- Seuls les podcasts validés sont visibles publiquement
CREATE POLICY "Validated podcasts are publicly visible"
ON public.podcasts FOR SELECT
USING (valide = true);
