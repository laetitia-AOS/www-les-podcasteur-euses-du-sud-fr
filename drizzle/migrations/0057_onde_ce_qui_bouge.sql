-- Lien externe en https seulement (pas de page du site, pas de http, pas de caractères de balisage).
CREATE OR REPLACE FUNCTION public.onde_lien_https(v text, label text, required boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $fn$
DECLARE s text := public.onde_txt(v, 500, label, required);
BEGIN
  IF s IS NOT NULL AND s !~* '^https://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]{1,5})?([/?#][^\s<>"''`\\]*)?$' THEN
    RAISE EXCEPTION 'Le lien « % » doit être une adresse complète qui commence par https://', label USING ERRCODE = 'P0001';
  END IF;
  RETURN s;
END $fn$;

CREATE OR REPLACE FUNCTION public.onde_bloc_propre(b jsonb, publier boolean, n integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $fn$
DECLARE
  t text;
  lab text := 'bloc ' || n;
  out jsonb;
  el jsonb;
  arr jsonb := '[]'::jsonb;
  liste jsonb;
  cnt integer;
  bid text;
  pid text;
  m text;
  uuid_re constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
BEGIN
  IF b IS NULL OR jsonb_typeof(b) <> 'object' THEN
    RAISE EXCEPTION 'Le % est mal formé.', lab USING ERRCODE = 'P0001';
  END IF;
  t := b->>'type';
  bid := left(regexp_replace(coalesce(b->>'id', ''), '[^A-Za-z0-9-]', '', 'g'), 40);
  IF bid = '' THEN bid := gen_random_uuid()::text; END IF;
  out := jsonb_build_object(
    'id', bid,
    'type', t,
    'rubrique', public.onde_txt(b->>'rubrique', 60, 'Rubrique du ' || lab, publier)
  );

  IF t = 'texte' THEN
    out := out || jsonb_build_object(
      'titre', public.onde_txt(b->>'titre', 120, 'Titre du ' || lab, false),
      'texte', public.onde_texte_riche(b->>'texte', 5000, 'Texte du ' || lab, publier)
    );

  ELSIF t = 'images' THEN
    liste := coalesce(b->'images', '[]'::jsonb);
    IF jsonb_typeof(liste) <> 'array' THEN RAISE EXCEPTION 'Le % est mal formé.', lab USING ERRCODE = 'P0001'; END IF;
    cnt := jsonb_array_length(liste);
    IF cnt > 6 THEN RAISE EXCEPTION 'Le % contient plus de 6 photos.', lab USING ERRCODE = 'P0001'; END IF;
    IF publier AND cnt < 1 THEN RAISE EXCEPTION 'Ajoutez au moins une photo dans le %.', lab USING ERRCODE = 'P0001'; END IF;
    FOR el IN SELECT value FROM jsonb_array_elements(liste) LOOP
      arr := arr || jsonb_build_array(jsonb_build_object(
        'url', public.onde_fichier(el->>'url', 'Photo du ' || lab, true),
        'alt', public.onde_txt(el->>'alt', 250, 'Texte alternatif d''une photo du ' || lab, publier)
      ));
    END LOOP;
    out := out || jsonb_build_object('images', arr);

  ELSIF t = 'audio' THEN
    out := out || jsonb_build_object(
      'url', public.onde_fichier(b->>'url', 'Fichier MP3 du ' || lab, publier),
      'titre', public.onde_txt(b->>'titre', 120, 'Titre de l''extrait du ' || lab, publier),
      'podcast', public.onde_txt(b->>'podcast', 120, 'Nom du podcast du ' || lab, false),
      'createur', public.onde_txt(b->>'createur', 120, 'Créateur·ice du ' || lab, false),
      'lien', public.onde_lien(b->>'lien', 'Épisode complet du ' || lab, false)
    );

  ELSIF t = 'bouton' THEN
    out := out || jsonb_build_object(
      'libelle', public.onde_txt(b->>'libelle', 60, 'Libellé du bouton du ' || lab, publier),
      'lien', public.onde_lien(b->>'lien', 'Lien du bouton du ' || lab, publier)
    );

  ELSIF t IN ('chiffres', 'trimestre') THEN
    IF t = 'trimestre' THEN
      out := out || jsonb_build_object(
        'titre', public.onde_txt(b->>'titre', 120, 'Titre du ' || lab, false),
        'texte', public.onde_texte_riche(b->>'texte', 5000, 'Texte du ' || lab, publier)
      );
    END IF;
    liste := coalesce(b->'chiffres', '[]'::jsonb);
    IF jsonb_typeof(liste) <> 'array' THEN RAISE EXCEPTION 'Le % est mal formé.', lab USING ERRCODE = 'P0001'; END IF;
    cnt := jsonb_array_length(liste);
    IF cnt > 4 THEN RAISE EXCEPTION 'Le % contient plus de 4 chiffres.', lab USING ERRCODE = 'P0001'; END IF;
    IF publier AND cnt < 2 THEN RAISE EXCEPTION 'Le % doit contenir au moins 2 chiffres.', lab USING ERRCODE = 'P0001'; END IF;
    FOR el IN SELECT value FROM jsonb_array_elements(liste) LOOP
      arr := arr || jsonb_build_array(jsonb_build_object(
        'valeur', coalesce(public.onde_txt(el->>'valeur', 20, 'Chiffre du ' || lab, publier), ''),
        'libelle', coalesce(public.onde_txt(el->>'libelle', 80, 'Libellé d''un chiffre du ' || lab, publier), '')
      ));
    END LOOP;
    out := out || jsonb_build_object('chiffres', arr);

  ELSIF t = 'evenements' THEN
    -- Seulement des identifiants d'événements : titre, date et lieu sont relus dans l'agenda à chaque affichage.
    liste := coalesce(b->'evenements', '[]'::jsonb);
    IF jsonb_typeof(liste) <> 'array' THEN RAISE EXCEPTION 'Le % est mal formé.', lab USING ERRCODE = 'P0001'; END IF;
    FOR el IN SELECT value FROM jsonb_array_elements(liste) LOOP
      IF jsonb_typeof(el) <> 'string' OR (el #>> '{}') !~ uuid_re THEN
        RAISE EXCEPTION 'Le % est mal formé.', lab USING ERRCODE = 'P0001';
      END IF;
      IF NOT arr @> jsonb_build_array(el) THEN arr := arr || jsonb_build_array(el); END IF;
    END LOOP;
    cnt := jsonb_array_length(arr);
    IF cnt > 8 THEN RAISE EXCEPTION 'Le % contient plus de 8 événements.', lab USING ERRCODE = 'P0001'; END IF;
    IF publier AND cnt < 1 THEN RAISE EXCEPTION 'Cochez au moins un événement dans le %.', lab USING ERRCODE = 'P0001'; END IF;
    out := out || jsonb_build_object('evenements', arr);

  ELSIF t = 'podcast' THEN
    -- Le podcast est relu dans l'annuaire à chaque affichage ; seuls la présentation et l'extrait sont écrits ici.
    pid := nullif(btrim(coalesce(b->>'podcast_id', '')), '');
    IF pid IS NOT NULL AND pid !~ uuid_re THEN RAISE EXCEPTION 'Le % est mal formé.', lab USING ERRCODE = 'P0001'; END IF;
    IF publier AND pid IS NULL THEN RAISE EXCEPTION 'Choisissez un podcast dans le %.', lab USING ERRCODE = 'P0001'; END IF;
    out := out || jsonb_build_object(
      'podcast_id', pid,
      'texte', public.onde_texte_riche(b->>'texte', 1500, 'Présentation du ' || lab, publier),
      'url', public.onde_fichier(b->>'url', 'Extrait MP3 du ' || lab, false),
      'titre', public.onde_txt(b->>'titre', 120, 'Titre de l''extrait du ' || lab, false),
      'plus_loin_texte', public.onde_txt(b->>'plus_loin_texte', 120, 'Pour aller plus loin (texte) du ' || lab, false),
      'plus_loin_lien', public.onde_lien_https(b->>'plus_loin_lien', 'Pour aller plus loin (lien) du ' || lab, false)
    );

  ELSIF t = 'ce_qui_bouge' THEN
    -- Rubrique de fond : titre, texte, source (nom + lien https), question aux membres
    out := out || jsonb_build_object(
      'titre', public.onde_txt(b->>'titre', 120, 'Titre du ' || lab, publier),
      'texte', public.onde_texte_riche(b->>'texte', 1200, 'Texte du ' || lab, publier),
      'source_nom', public.onde_txt(b->>'source_nom', 80, 'Nom de la source du ' || lab, false),
      'source_lien', public.onde_lien_https(b->>'source_lien', 'Lien de la source du ' || lab, false),
      'question', public.onde_txt(b->>'question', 200, 'Question aux membres du ' || lab, false)
    );

  ELSIF t = 'nouveaux_membres' THEN
    -- Seul le mois est écrit ; la liste des personnes est calculée par la base (voir guard_onde_numeros).
    m := nullif(btrim(coalesce(b->>'mois', '')), '');
    IF m IS NOT NULL AND m !~ '^\d{4}-(0[1-9]|1[0-2])(-01)?$' THEN RAISE EXCEPTION 'Le mois du % est mal formé.', lab USING ERRCODE = 'P0001'; END IF;
    IF publier AND m IS NULL THEN RAISE EXCEPTION 'Choisissez le mois du %.', lab USING ERRCODE = 'P0001'; END IF;
    out := out || jsonb_build_object('mois', CASE WHEN m IS NULL THEN NULL ELSE to_char(to_date(left(m, 7) || '-01', 'YYYY-MM-DD'), 'YYYY-MM-DD') END);

  ELSE
    RAISE EXCEPTION 'Le % a un type inconnu.', lab USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_strip_nulls(out);
END $fn$;