
-- Update: auto-validate only if podcast has a vignette
CREATE OR REPLACE FUNCTION public.auto_validate_podcast_on_adhesion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
    UPDATE public.podcasts
    SET valide = true
    WHERE lower(email) = lower(NEW.email)
      AND valide = false
      AND vignette_url IS NOT NULL
      AND vignette_url <> '';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_validate_podcast_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email <> '' 
     AND NEW.vignette_url IS NOT NULL AND NEW.vignette_url <> '' THEN
    IF EXISTS (
      SELECT 1 FROM public.adhesions
      WHERE lower(email) = lower(NEW.email)
    ) THEN
      NEW.valide := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
