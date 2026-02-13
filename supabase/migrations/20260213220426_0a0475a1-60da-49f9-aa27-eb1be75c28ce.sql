
-- Add scoring columns
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS score_fiche integer NOT NULL DEFAULT 0;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS score_dynamique integer NOT NULL DEFAULT 0;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS score_opportunite integer NOT NULL DEFAULT 0;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS score_global integer NOT NULL DEFAULT 0;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS segment_pds text NOT NULL DEFAULT 'À qualifier';

-- Create scoring function
CREATE OR REPLACE FUNCTION public.calculate_podcast_scores()
RETURNS TRIGGER AS $$
DECLARE
  s_fiche integer := 0;
  s_dyn integer := 0;
  s_opp integer := 0;
  s_global integer := 0;
  seg text := 'À qualifier';
BEGIN
  -- score_fiche (0-10)
  IF NEW.lien_ecoute IS NOT NULL AND NEW.lien_ecoute ~ '^https?://' THEN s_fiche := s_fiche + 2; END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) >= 20 THEN s_fiche := s_fiche + 2; END IF;
  IF NEW.vignette_url IS NOT NULL AND NEW.vignette_url <> '' THEN s_fiche := s_fiche + 2; END IF;
  IF NEW.thematique IS NOT NULL AND NEW.thematique <> '' THEN s_fiche := s_fiche + 1; END IF;
  IF NEW.city_insee_code IS NOT NULL AND NEW.department_code IS NOT NULL THEN s_fiche := s_fiche + 1; END IF;
  IF NEW.type_podcast IS NOT NULL AND NEW.type_podcast <> '' THEN s_fiche := s_fiche + 1; END IF;
  IF NEW.email IS NOT NULL AND NEW.prenom IS NOT NULL AND NEW.nom IS NOT NULL 
     AND NEW.email <> '' AND NEW.prenom <> '' AND NEW.nom <> '' THEN s_fiche := s_fiche + 1; END IF;
  IF s_fiche > 10 THEN s_fiche := 10; END IF;

  -- score_dynamique (0-10)
  IF NEW.frequence_publication = 'hebdomadaire' THEN s_dyn := s_dyn + 4;
  ELSIF NEW.frequence_publication = 'bimensuel' THEN s_dyn := s_dyn + 3;
  ELSIF NEW.frequence_publication = 'mensuel' THEN s_dyn := s_dyn + 2;
  END IF;

  IF NEW.niveau_avancement = 'installe' THEN s_dyn := s_dyn + 4;
  ELSIF NEW.niveau_avancement = 'croissance' THEN s_dyn := s_dyn + 3;
  ELSIF NEW.niveau_avancement = 'lancement' THEN s_dyn := s_dyn + 2;
  END IF;
  IF s_dyn > 10 THEN s_dyn := 10; END IF;

  -- score_opportunite (0-10) based on priorite + besoins + consent
  IF NEW.priorite_actuelle IS NOT NULL AND NEW.priorite_actuelle <> '' THEN s_opp := s_opp + 3; END IF;
  IF NEW.besoins_podcast IS NOT NULL AND array_length(NEW.besoins_podcast, 1) > 0 
     AND NEW.besoins_podcast <> ARRAY['non_specifie'] THEN
    s_opp := s_opp + LEAST(array_length(NEW.besoins_podcast, 1), 3);
  END IF;
  IF NEW.consent_contact = true THEN s_opp := s_opp + 2; END IF;
  IF NEW.consent_mise_en_relation = true THEN s_opp := s_opp + 2; END IF;
  IF s_opp > 10 THEN s_opp := 10; END IF;

  -- score_global (0-100)
  s_global := ROUND((s_fiche + s_dyn + s_opp)::numeric / 30 * 100);
  IF s_global > 100 THEN s_global := 100; END IF;

  -- segment_pds
  IF s_global >= 75 THEN seg := 'Ambassadeur potentiel';
  ELSIF s_global >= 50 THEN seg := 'Actif engagé';
  ELSIF s_global >= 25 THEN seg := 'En développement';
  ELSE seg := 'À qualifier';
  END IF;

  NEW.score_fiche := s_fiche;
  NEW.score_dynamique := s_dyn;
  NEW.score_opportunite := s_opp;
  NEW.score_global := s_global;
  NEW.segment_pds := seg;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger on insert and update
CREATE TRIGGER trg_calculate_podcast_scores
BEFORE INSERT OR UPDATE ON public.podcasts
FOR EACH ROW
EXECUTE FUNCTION public.calculate_podcast_scores();
