
ALTER TABLE public.evenements ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Generate slugs for existing events
UPDATE public.evenements
SET slug = lower(
  regexp_replace(
    regexp_replace(
      unaccent(
        type || '-' || titre || COALESCE('-' || lieu, '')
      ),
      '[^a-zA-Z0-9\-]+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.generate_evenement_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := lower(
    trim(both '-' from
      regexp_replace(
        regexp_replace(
          unaccent(
            NEW.type || '-' || NEW.titre || COALESCE('-' || NEW.lieu, '')
          ),
          '[^a-zA-Z0-9\-]+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    )
  );
  
  final_slug := base_slug;
  
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.evenements WHERE slug = final_slug AND id != NEW.id) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evenement_slug
BEFORE INSERT OR UPDATE OF titre, lieu, type ON public.evenements
FOR EACH ROW
EXECUTE FUNCTION public.generate_evenement_slug();
