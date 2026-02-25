
-- Drop existing functions to recreate with stricter logic
DROP FUNCTION IF EXISTS public.auto_validate_podcast_on_insert() CASCADE;
DROP FUNCTION IF EXISTS public.auto_validate_podcast_on_adhesion() CASCADE;

-- Stricter auto-validation on podcast insert
-- Requires: email match in adhesions + vignette + valid podcast URL + complete data
CREATE OR REPLACE FUNCTION public.auto_validate_podcast_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Default: not validated
  NEW.valide := false;

  -- All conditions must be met for auto-validation:
  -- 1. Email present
  -- 2. Vignette present
  -- 3. Valid podcast platform URL
  -- 4. Complete core data (nom_podcast, description >= 20 chars, thematique)
  -- 5. Email matches an active adhesion
  IF NEW.email IS NOT NULL AND NEW.email <> ''
     AND NEW.vignette_url IS NOT NULL AND NEW.vignette_url <> ''
     AND NEW.nom_podcast IS NOT NULL AND length(NEW.nom_podcast) >= 3
     AND NEW.description IS NOT NULL AND length(NEW.description) >= 20
     AND NEW.thematique IS NOT NULL AND NEW.thematique <> ''
     AND NEW.lien_ecoute IS NOT NULL
     AND NEW.lien_ecoute ~ '^https?://(www\.)?(open\.spotify\.com|podcasters\.spotify\.com|podcasts\.apple\.com|music\.amazon\.com|amazon\.com|deezer\.com|youtube\.com|youtu\.be|soundcloud\.com|podcloud\.fr|ausha\.co|acast\.com|anchor\.fm|spreaker\.com|podbean\.com|castbox\.fm|overcast\.fm|pocketcasts\.com|listen\.pocketcasts\.com|pod\.link|smartlink\.|linktr\.ee|bfrn\.co|feeds\.buzzsprout\.com|buzzsprout\.com|simplecast\.com|transistor\.fm|captivate\.fm|megaphone\.fm|omnystudio\.com|audiomeans\.fr|podcastics\.com|rfrn\.co|radiofrance\.fr|arte\.tv|radiomeuh\.com|luminary\.link|stitcher\.com|tunein\.com|iheart\.com|pandora\.com|player\.fm|castro\.fm|fountain\.fm|goodpods\.com)/'
  THEN
    IF EXISTS (
      SELECT 1 FROM public.adhesions
      WHERE lower(email) = lower(NEW.email)
        AND statut = 'active'
    ) THEN
      NEW.valide := true;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Trigger on podcast insert
CREATE TRIGGER trg_auto_validate_podcast_on_insert
  BEFORE INSERT ON public.podcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_podcast_on_insert();

-- When a new adhesion arrives, re-check matching podcasts with strict criteria
CREATE OR REPLACE FUNCTION public.auto_validate_podcast_on_adhesion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
    UPDATE public.podcasts
    SET valide = true
    WHERE lower(email) = lower(NEW.email)
      AND valide = false
      AND vignette_url IS NOT NULL AND vignette_url <> ''
      AND nom_podcast IS NOT NULL AND length(nom_podcast) >= 3
      AND description IS NOT NULL AND length(description) >= 20
      AND thematique IS NOT NULL AND thematique <> ''
      AND lien_ecoute ~ '^https?://(www\.)?(open\.spotify\.com|podcasters\.spotify\.com|podcasts\.apple\.com|music\.amazon\.com|amazon\.com|deezer\.com|youtube\.com|youtu\.be|soundcloud\.com|podcloud\.fr|ausha\.co|acast\.com|anchor\.fm|spreaker\.com|podbean\.com|castbox\.fm|overcast\.fm|pocketcasts\.com|listen\.pocketcasts\.com|pod\.link|smartlink\.|linktr\.ee|bfrn\.co|feeds\.buzzsprout\.com|buzzsprout\.com|simplecast\.com|transistor\.fm|captivate\.fm|megaphone\.fm|omnystudio\.com|audiomeans\.fr|podcastics\.com|rfrn\.co|radiofrance\.fr|arte\.tv|radiomeuh\.com|luminary\.link|stitcher\.com|tunein\.com|iheart\.com|pandora\.com|player\.fm|castro\.fm|fountain\.fm|goodpods\.com)/';
  END IF;
  RETURN NEW;
END;
$function$;

-- Trigger on adhesion insert
CREATE TRIGGER trg_auto_validate_podcast_on_adhesion
  BEFORE INSERT ON public.adhesions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_podcast_on_adhesion();
