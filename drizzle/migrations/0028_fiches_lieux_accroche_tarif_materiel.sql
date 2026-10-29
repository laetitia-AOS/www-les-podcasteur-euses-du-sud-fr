ALTER TABLE public.fiches_lieux
  ADD COLUMN IF NOT EXISTS accroche text,
  ADD COLUMN IF NOT EXISTS description_longue text,
  ADD COLUMN IF NOT EXISTS tarif_unite text,
  ADD COLUMN IF NOT EXISTS tarif_taxe text;

ALTER TABLE public.fiches_lieux
  ADD CONSTRAINT fiches_lieux_tarif_unite_check CHECK (tarif_unite IS NULL OR tarif_unite IN ('heure', 'demi_journee', 'jour')),
  ADD CONSTRAINT fiches_lieux_tarif_taxe_check CHECK (tarif_taxe IS NULL OR tarif_taxe IN ('TTC', 'HT'));

COMMENT ON COLUMN public.fiches_lieux.tarif_heure IS 'Montant « à partir de » du tarif ; unité dans tarif_unite, TTC/HT dans tarif_taxe. Vide : « Sur devis ».';
COMMENT ON COLUMN public.fiches_lieux.accroche IS 'Accroche courte sous le titre (160 caractères ; un texte plus ancien plus long reste tel quel, il peut seulement être raccourci).';
COMMENT ON COLUMN public.fiches_lieux.description_longue IS 'Description longue (« Le studio » / « Présentation ») ; vide : section masquée.';

-- Reprise des textes et du tarif existants (avant la nouvelle vérification, qui refuserait une accroche de plus de 160 caractères)
UPDATE public.fiches_lieux f
SET accroche = nullif(btrim(coalesce(p.studio_data ->> 'accroche', p.studio_data ->> 'phrase_accroche', '')), '')
FROM public.podcasts p
WHERE p.id = f.podcast_id AND f.accroche IS NULL;

UPDATE public.fiches_lieux f
SET description_longue = nullif(btrim(coalesce(p.bio_750, p.description, '')), '')
FROM public.podcasts p
WHERE p.id = f.podcast_id AND p.type_profil = 'structure_eco' AND f.description_longue IS NULL;

UPDATE public.fiches_lieux SET tarif_heure = 48, tarif_unite = 'heure', tarif_taxe = 'TTC'
WHERE podcast_id = 'e82569ff-72c4-4714-a208-8751d3734e85';

CREATE OR REPLACE FUNCTION public.guard_fiches_lieux()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  e jsonb; out jsonb; u text; d text; mat text;
BEGIN
  NEW.updated_at := now();
  NEW.acces_transports := public.pds_txt(NEW.acces_transports, 200, 'Accès');
  NEW.accessibilite := public.pds_txt(NEW.accessibilite, 300, 'Accessibilité');

  -- Accroche : 160 caractères ; un texte déjà enregistré plus long reste accepté tant qu'il ne s'allonge pas
  NEW.accroche := public.pds_txt(NEW.accroche, 1000, 'Accroche');
  IF NEW.accroche IS NOT NULL AND char_length(NEW.accroche) > 160
     AND (TG_OP = 'INSERT' OR OLD.accroche IS NULL OR char_length(NEW.accroche) > char_length(OLD.accroche)) THEN
    RAISE EXCEPTION 'L''accroche fait 160 caractères au maximum.' USING ERRCODE = 'P0001';
  END IF;
  NEW.description_longue := public.pds_txt(NEW.description_longue, 3000, 'Description');

  -- Tarif : montant, unité, TTC ou HT ; sans montant, « Sur devis »
  IF NEW.tarif_heure IS NULL THEN
    NEW.tarif_unite := NULL; NEW.tarif_taxe := NULL;
  ELSE
    IF NEW.tarif_heure < 0 OR NEW.tarif_heure > 100000 THEN
      RAISE EXCEPTION 'Tarif invalide.' USING ERRCODE = 'P0001';
    END IF;
    NEW.tarif_unite := coalesce(NEW.tarif_unite, 'heure');
    NEW.tarif_taxe := coalesce(NEW.tarif_taxe, 'TTC');
  END IF;

  NEW.services := coalesce((SELECT array_agg(DISTINCT s ORDER BY s) FROM unnest(coalesce(NEW.services, '{}')) s), '{}');
  IF NOT (NEW.services <@ public.pds_services_studio()) THEN
    RAISE EXCEPTION 'Service inconnu.' USING ERRCODE = 'P0001';
  END IF;

  IF cardinality(NEW.photos) > 5 THEN RAISE EXCEPTION '5 photos au maximum.' USING ERRCODE = 'P0001'; END IF;
  NEW.photos := coalesce((SELECT array_agg(public.pds_url(x, 'Photo') ORDER BY i) FROM unnest(NEW.photos) WITH ORDINALITY t(x, i) WHERE coalesce(x, '') <> ''), '{}');

  -- Équipement : « Matériel » regroupe micros, caméras, console, logiciels ; anciens champs micros/caméras repris dedans
  IF jsonb_typeof(NEW.equipement) <> 'object' THEN NEW.equipement := '{}'::jsonb; END IF;
  mat := public.pds_jsonb_txt(NEW.equipement -> 'materiel', 600, 'Matériel');
  IF mat IS NULL THEN
    mat := nullif(concat_ws(E'\n',
      public.pds_jsonb_txt(NEW.equipement -> 'micros', 600, 'Matériel'),
      public.pds_jsonb_txt(NEW.equipement -> 'cameras', 600, 'Matériel')), '');
    mat := public.pds_txt(mat, 600, 'Matériel');
  END IF;
  NEW.equipement := jsonb_strip_nulls(jsonb_build_object(
    'materiel', mat,
    'lumieres_decor', public.pds_jsonb_txt(NEW.equipement -> 'lumieres_decor', 200, 'Lumières et décor'),
    'technicien', CASE WHEN jsonb_typeof(NEW.equipement -> 'technicien') = 'boolean' THEN NEW.equipement -> 'technicien' END
  ));

  -- Questions fréquentes (3)
  IF jsonb_typeof(NEW.faq) <> 'array' OR jsonb_array_length(NEW.faq) > 3 THEN
    RAISE EXCEPTION '3 questions fréquentes au maximum.' USING ERRCODE = 'P0001';
  END IF;
  out := '[]'::jsonb;
  FOR e IN SELECT * FROM jsonb_array_elements(NEW.faq) LOOP
    IF public.pds_jsonb_txt(e -> 'q', 200, 'Question') IS NOT NULL THEN
      out := out || jsonb_build_object('q', public.pds_jsonb_txt(e -> 'q', 200, 'Question'), 'r', coalesce(public.pds_jsonb_txt(e -> 'r', 800, 'Réponse'), ''));
    END IF;
  END LOOP;
  NEW.faq := out;

  -- Liens (site, réseaux) : 6 au maximum, https
  IF jsonb_typeof(NEW.liens) <> 'array' OR jsonb_array_length(NEW.liens) > 6 THEN
    RAISE EXCEPTION '6 liens au maximum.' USING ERRCODE = 'P0001';
  END IF;
  out := '[]'::jsonb;
  FOR e IN SELECT * FROM jsonb_array_elements(NEW.liens) LOOP
    u := public.pds_url(CASE WHEN jsonb_typeof(e -> 'url') = 'string' THEN e ->> 'url' END, 'Lien');
    IF u IS NOT NULL THEN
      IF u !~* '^https://' THEN RAISE EXCEPTION 'Les liens doivent commencer par https://' USING ERRCODE = 'P0001'; END IF;
      out := out || jsonb_build_object('label', coalesce(public.pds_jsonb_txt(e -> 'label', 40, 'Nom du lien'), 'Lien'), 'url', u);
    END IF;
  END LOOP;
  NEW.liens := out;

  -- Ce que la structure propose (3)
  IF jsonb_typeof(NEW.propositions) <> 'array' OR jsonb_array_length(NEW.propositions) > 3 THEN
    RAISE EXCEPTION '3 propositions au maximum.' USING ERRCODE = 'P0001';
  END IF;
  out := '[]'::jsonb;
  FOR e IN SELECT * FROM jsonb_array_elements(NEW.propositions) LOOP
    IF public.pds_jsonb_txt(e -> 'titre', 80, 'Titre') IS NOT NULL THEN
      out := out || jsonb_build_object('titre', public.pds_jsonb_txt(e -> 'titre', 80, 'Titre'), 'texte', coalesce(public.pds_jsonb_txt(e -> 'texte', 400, 'Texte'), ''));
    END IF;
  END LOOP;
  NEW.propositions := out;

  -- Liens presse datés (10)
  IF jsonb_typeof(NEW.presse) <> 'array' OR jsonb_array_length(NEW.presse) > 10 THEN
    RAISE EXCEPTION '10 liens presse au maximum.' USING ERRCODE = 'P0001';
  END IF;
  out := '[]'::jsonb;
  FOR e IN SELECT * FROM jsonb_array_elements(NEW.presse) LOOP
    u := public.pds_url(CASE WHEN jsonb_typeof(e -> 'url') = 'string' THEN e ->> 'url' END, 'Lien presse');
    d := CASE WHEN jsonb_typeof(e -> 'date') = 'string' AND (e ->> 'date') ~ '^\d{4}-\d{2}(-\d{2})?$' THEN e ->> 'date' END;
    IF u IS NOT NULL THEN
      out := out || jsonb_strip_nulls(jsonb_build_object('titre', coalesce(public.pds_jsonb_txt(e -> 'titre', 150, 'Titre'), 'Article'), 'url', u, 'date', d));
    END IF;
  END LOOP;
  NEW.presse := out;

  -- Podcasts membres liés (12), uniquement des fiches visibles
  IF jsonb_typeof(NEW.podcasts_lies) <> 'array' OR jsonb_array_length(NEW.podcasts_lies) > 12 THEN
    RAISE EXCEPTION '12 podcasts liés au maximum.' USING ERRCODE = 'P0001';
  END IF;
  out := '[]'::jsonb;
  FOR e IN SELECT * FROM jsonb_array_elements(NEW.podcasts_lies) LOOP
    IF jsonb_typeof(e -> 'id') = 'string' AND (e ->> 'id') ~ '^[0-9a-f-]{36}$'
       AND EXISTS (SELECT 1 FROM public.podcasts p WHERE p.id = (e ->> 'id')::uuid AND p.valide AND p.id <> NEW.podcast_id) THEN
      d := CASE WHEN jsonb_typeof(e -> 'date') = 'string' AND (e ->> 'date') ~ '^\d{4}-\d{2}(-\d{2})?$' THEN e ->> 'date' END;
      out := out || jsonb_strip_nulls(jsonb_build_object('id', e ->> 'id', 'date', d,
        'url', public.pds_url(CASE WHEN jsonb_typeof(e -> 'url') = 'string' THEN e ->> 'url' END, 'Lien')));
    END IF;
  END LOOP;
  NEW.podcasts_lies := out;
  RETURN NEW;
END $function$;

-- « Micros » et « Caméras » regroupés dans « Matériel » (la vérification ci-dessus fait la reprise)
UPDATE public.fiches_lieux SET equipement = equipement WHERE equipement ? 'micros' OR equipement ? 'cameras';