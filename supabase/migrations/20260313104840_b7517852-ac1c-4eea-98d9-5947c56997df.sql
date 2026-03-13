
-- Add studio_data JSONB column to podcasts table
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS studio_data jsonb DEFAULT NULL;

-- Update the slug generation function to handle studio type
CREATE OR REPLACE FUNCTION public.generate_podcast_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := '';
  
  -- Studio type: nom-du-lieu-statut-structure-ville
  IF NEW.type_profil = 'studio' THEN
    IF NEW.nom_podcast IS NOT NULL AND NEW.nom_podcast <> '' THEN
      base_slug := NEW.nom_podcast;
    END IF;
    
    IF NEW.studio_data IS NOT NULL AND NEW.studio_data->>'statut_structure' IS NOT NULL AND NEW.studio_data->>'statut_structure' <> '' THEN
      IF base_slug <> '' THEN base_slug := base_slug || ' '; END IF;
      base_slug := base_slug || (NEW.studio_data->>'statut_structure');
    END IF;
    
    IF NEW.city_name IS NOT NULL AND NEW.city_name <> '' THEN
      IF base_slug <> '' THEN base_slug := base_slug || ' '; END IF;
      base_slug := base_slug || NEW.city_name;
    END IF;
  -- Include podcast name for podcasteurs
  ELSIF NEW.type_profil = 'podcasteur' AND NEW.nom_podcast IS NOT NULL AND NEW.nom_podcast <> '' THEN
    base_slug := NEW.nom_podcast;
    
    IF NEW.prenom IS NOT NULL AND NEW.prenom <> '' THEN
      IF base_slug <> '' THEN base_slug := base_slug || ' '; END IF;
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
  ELSE
    IF NEW.prenom IS NOT NULL AND NEW.prenom <> '' THEN
      IF base_slug <> '' THEN base_slug := base_slug || ' '; END IF;
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
    
    -- Include metier for pros
    IF NEW.type_profil <> 'podcasteur' AND NEW.type_profil <> 'studio' AND NEW.metier_principal IS NOT NULL AND NEW.metier_principal <> '' THEN
      IF base_slug <> '' THEN base_slug := base_slug || ' '; END IF;
      base_slug := base_slug || NEW.metier_principal;
    END IF;
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
$function$;
