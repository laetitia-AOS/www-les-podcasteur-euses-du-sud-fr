
-- Update slug generation function to include metier_principal
CREATE OR REPLACE FUNCTION public.generate_podcast_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := '';
  
  IF NEW.prenom IS NOT NULL AND NEW.prenom <> '' THEN
    base_slug := base_slug || NEW.prenom;
  END IF;
  
  IF NEW.nom IS NOT NULL AND NEW.nom <> '' THEN
    IF base_slug <> '' THEN base_slug := base_slug || ' '; END IF;
    base_slug := base_slug || NEW.nom;
  END IF;
  
  IF NEW.city_name IS NOT NULL AND NEW.city_name <> '' THEN
    IF base_slug <> '' THEN base_slug := base_slug || ' '; END IF;
    base_slug := base_slug || NEW.city_name;
  END IF;
  
  IF NEW.metier_principal IS NOT NULL AND NEW.metier_principal <> '' THEN
    IF base_slug <> '' THEN base_slug := base_slug || ' '; END IF;
    base_slug := base_slug || NEW.metier_principal;
  END IF;
  
  IF base_slug = '' THEN
    NEW.slug := NEW.id::text;
    RETURN NEW;
  END IF;
  
  base_slug := lower(unaccent(base_slug));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.podcasts WHERE slug = final_slug AND id <> NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Update trigger to also fire on metier_principal changes
DROP TRIGGER IF EXISTS trg_generate_podcast_slug ON public.podcasts;
CREATE TRIGGER trg_generate_podcast_slug
  BEFORE INSERT OR UPDATE OF prenom, nom, city_name, metier_principal
  ON public.podcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_podcast_slug();
