
-- When a new adhesion is inserted, auto-validate matching podcasts by email
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
      AND valide = false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_validate_on_adhesion
  AFTER INSERT ON public.adhesions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_podcast_on_adhesion();

-- When a new podcast is inserted, auto-validate if matching adhesion exists
CREATE OR REPLACE FUNCTION public.auto_validate_podcast_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
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

CREATE TRIGGER trg_auto_validate_podcast_if_member
  BEFORE INSERT ON public.podcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_validate_podcast_on_insert();
