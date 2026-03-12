-- Add slug column to podcasts
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_podcasts_slug ON public.podcasts(slug) WHERE slug IS NOT NULL;

-- Function to generate a slug from prenom, nom, ville
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
  -- Build base slug from prenom + nom + city_name
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
  
  -- Fallback to id if no name data
  IF base_slug = '' THEN
    NEW.slug := NEW.id::text;
    RETURN NEW;
  END IF;
  
  -- Normalize: lowercase, remove accents, replace non-alphanum with hyphens
  base_slug := lower(unaccent(base_slug));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  
  final_slug := base_slug;
  
  -- Handle duplicates
  WHILE EXISTS (SELECT 1 FROM public.podcasts WHERE slug = final_slug AND id <> NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate slug on insert/update
CREATE TRIGGER trg_generate_podcast_slug
  BEFORE INSERT OR UPDATE OF prenom, nom, city_name
  ON public.podcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_podcast_slug();

-- Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Generate slugs for existing rows
UPDATE public.podcasts SET slug = NULL WHERE slug IS NULL;
-- Trigger the slug generation for all existing rows
DO $$
DECLARE
  r RECORD;
  base_slug text;
  final_slug text;
  counter integer;
BEGIN
  FOR r IN SELECT id, prenom, nom, city_name FROM public.podcasts WHERE slug IS NULL ORDER BY created_at LOOP
    base_slug := '';
    IF r.prenom IS NOT NULL AND r.prenom <> '' THEN base_slug := r.prenom; END IF;
    IF r.nom IS NOT NULL AND r.nom <> '' THEN
      IF base_slug <> '' THEN base_slug := base_slug || ' '; END IF;
      base_slug := base_slug || r.nom;
    END IF;
    IF r.city_name IS NOT NULL AND r.city_name <> '' THEN
      IF base_slug <> '' THEN base_slug := base_slug || ' '; END IF;
      base_slug := base_slug || r.city_name;
    END IF;
    
    IF base_slug = '' THEN
      final_slug := r.id::text;
    ELSE
      base_slug := lower(unaccent(base_slug));
      base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
      base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
      final_slug := base_slug;
      counter := 0;
      WHILE EXISTS (SELECT 1 FROM public.podcasts WHERE slug = final_slug AND id <> r.id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
      END LOOP;
    END IF;
    
    UPDATE public.podcasts SET slug = final_slug WHERE id = r.id;
  END LOOP;
END;
$$;