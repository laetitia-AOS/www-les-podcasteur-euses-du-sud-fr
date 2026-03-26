
CREATE OR REPLACE FUNCTION public.generate_evenement_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
  date_part text;
BEGIN
  -- Build: titre-lieu-AAAA-MM-JJ
  base_slug := '';

  IF NEW.titre IS NOT NULL AND NEW.titre <> '' THEN
    base_slug := NEW.titre;
  END IF;

  IF NEW.lieu IS NOT NULL AND NEW.lieu <> '' THEN
    base_slug := base_slug || ' ' || NEW.lieu;
  END IF;

  -- Add date in YYYY-MM-DD format
  IF NEW.date_debut IS NOT NULL THEN
    date_part := to_char(NEW.date_debut, 'YYYY-MM-DD');
    base_slug := base_slug || ' ' || date_part;
  END IF;

  IF base_slug = '' THEN
    NEW.slug := NEW.id::text;
    RETURN NEW;
  END IF;

  base_slug := lower(
    trim(both '-' from
      regexp_replace(
        regexp_replace(
          unaccent(base_slug),
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
$function$;
