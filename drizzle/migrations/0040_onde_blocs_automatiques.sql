-- L'Onde du Sud, lot 2 : blocs automatiques (événements de l'agenda, podcast à l'écoute,
-- nouveaux membres du mois, trimestre du collectif). Aucune table existante n'est modifiée :
-- les blocs lisent l'agenda, l'annuaire et les adhésions au moment de l'affichage.
-- Les données d'adhésion ne sortent jamais de la base : seules des cartes (nom, photo, podcast, ville, adresse de fiche) sont renvoyées.

CREATE OR REPLACE FUNCTION public.onde_bloc_propre(b jsonb, publier boolean, n integer)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
      'titre', public.onde_txt(b->>'titre', 120, 'Titre de l''extrait du ' || lab, false)
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
END $$;

-- Calcul interne des nouveaux membres d'un mois (jamais appelé directement par le site).
-- Une personne = une adresse e-mail (adhésion, ou rattachement d'un paiement fait sous un autre nom).
-- « Nouveau » : sa toute première adhésion date de ce mois, et elle est active.
-- Sont aussi repris les mois déjà couverts par un numéro publié : une personne en attente d'une fiche
-- complète y apparaît dès que sa fiche est complète. Personne n'est montré deux fois.
CREATE OR REPLACE FUNCTION public.onde_membres_calcul(_mois date, _numero_id uuid)
RETURNS TABLE(email text, du_mois boolean, complet boolean, deja boolean, podcast_id uuid, nom text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH pay AS (
    SELECT lower(a.email) AS e, coalesce(a.date_adhesion, a.created_at) AS d, a.statut, a.prenom, a.nom
    FROM public.adhesions a
    WHERE coalesce(a.email, '') <> ''
      AND NOT EXISTS (SELECT 1 FROM public.adhesion_rattachements r WHERE r.adhesion_id = a.id)
    UNION ALL
    SELECT lower(r.email_membre), coalesce(a.date_adhesion, a.created_at), a.statut, a.prenom, a.nom
    FROM public.adhesion_rattachements r JOIN public.adhesions a ON a.id = r.adhesion_id
  ),
  gens AS (
    SELECT pay.e,
      date_trunc('month', min(pay.d) AT TIME ZONE 'Europe/Paris')::date AS premier_mois,
      bool_or(pay.statut = 'active') AS active,
      (array_agg(nullif(btrim(concat_ws(' ', pay.prenom, pay.nom)), '') ORDER BY pay.d))[1] AS nom_paiement
    FROM pay GROUP BY pay.e
  ),
  publies AS (
    SELECT bl.value AS bloc
    FROM public.onde_numeros o CROSS JOIN LATERAL jsonb_array_elements(o.blocs) bl
    WHERE o.statut = 'publie' AND o.id IS DISTINCT FROM _numero_id AND bl.value->>'type' = 'nouveaux_membres'
  ),
  mois_vises AS (
    SELECT date_trunc('month', _mois)::date AS m
    UNION
    SELECT (p.bloc->>'mois')::date FROM publies p
    WHERE p.bloc->>'mois' IS NOT NULL AND (p.bloc->>'mois')::date < date_trunc('month', _mois)::date
  ),
  deja AS (
    SELECT DISTINCT lower(pc.email) AS e
    FROM publies p
    CROSS JOIN LATERAL jsonb_array_elements_text(CASE WHEN jsonb_typeof(p.bloc->'membres') = 'array' THEN p.bloc->'membres' ELSE '[]'::jsonb END) mid(v)
    JOIN public.podcasts pc ON pc.id::text = mid.v
  ),
  fiche AS (
    SELECT lower(pc.email) AS e,
      bool_or(coalesce(pc.photo_profil_url, '') <> '') AS photo,
      (array_agg(pc.id ORDER BY pc.created_at) FILTER (
        WHERE pc.valide AND pc.type_profil = 'podcasteur'
          AND coalesce(pc.nom_podcast, '') !~ '^[—–.[:space:]-]*$'
          AND public.podcast_visible(pc.id)))[1] AS pod,
      (array_agg(nullif(btrim(concat_ws(' ', pc.prenom, pc.nom)), '') ORDER BY pc.created_at)
        FILTER (WHERE nullif(btrim(concat_ws(' ', pc.prenom, pc.nom)), '') IS NOT NULL))[1] AS nom
    FROM public.podcasts pc GROUP BY lower(pc.email)
  )
  SELECT g.e,
    g.premier_mois = date_trunc('month', _mois)::date,
    coalesce(f.photo, false) AND f.pod IS NOT NULL,
    d.e IS NOT NULL,
    f.pod,
    coalesce(f.nom, g.nom_paiement, 'Sans nom')
  FROM gens g
  LEFT JOIN fiche f ON f.e = g.e
  LEFT JOIN deja d ON d.e = g.e
  WHERE g.active AND g.premier_mois IN (SELECT m FROM mois_vises)
$$;

-- Cartes publiques : rien d'autre que nom, photo, podcast, ville et adresse de la fiche, fiches visibles seulement.
CREATE OR REPLACE FUNCTION public.onde_cartes_membres(_ids uuid[])
RETURNS TABLE(id uuid, prenom text, nom text, photo_url text, nom_podcast text, ville text, slug text, type_profil text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT p.id, p.prenom, p.nom,
    coalesce(nullif(p.photo_profil_url, ''),
      (SELECT q.photo_profil_url FROM public.podcasts q
        WHERE lower(q.email) = lower(p.email) AND coalesce(q.photo_profil_url, '') <> ''
        ORDER BY q.created_at LIMIT 1)),
    p.nom_podcast, p.city_name, p.slug, p.type_profil
  FROM public.podcasts p
  WHERE p.id = ANY(coalesce(_ids, '{}'::uuid[])) AND public.podcast_visible(p.id)
  ORDER BY lower(coalesce(p.prenom, '')), lower(coalesce(p.nom, ''))
$$;

REVOKE EXECUTE ON FUNCTION public.onde_membres_calcul(date, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.onde_cartes_membres(uuid[]) FROM PUBLIC, anon, authenticated;

-- Bloc « Les nouveaux membres du mois » d'un numéro, tel qu'il s'affiche.
-- Numéro publié : la liste arrêtée à la publication. Brouillon : calcul en direct, pour l'équipe seulement.
CREATE OR REPLACE FUNCTION public.onde_nouveaux_membres(_numero_id uuid, _bloc_id text)
RETURNS TABLE(id uuid, prenom text, nom text, photo_url text, nom_podcast text, ville text, slug text, type_profil text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
#variable_conflict use_column
DECLARE
  o_statut text;
  o_blocs jsonb;
  bl jsonb;
  ids uuid[];
BEGIN
  SELECT o.statut, o.blocs INTO o_statut, o_blocs FROM public.onde_numeros o WHERE o.id = _numero_id;
  IF o_statut IS NULL THEN RETURN; END IF;
  IF o_statut <> 'publie' AND NOT public.peut_editer_onde() THEN RETURN; END IF;
  SELECT x.value INTO bl FROM jsonb_array_elements(o_blocs) x
    WHERE x.value->>'id' = _bloc_id AND x.value->>'type' = 'nouveaux_membres' LIMIT 1;
  IF bl IS NULL THEN RETURN; END IF;
  IF jsonb_typeof(bl->'membres') = 'array' THEN
    ids := ARRAY(SELECT v::uuid FROM jsonb_array_elements_text(bl->'membres') v);
  ELSIF o_statut <> 'publie' AND bl->>'mois' IS NOT NULL THEN
    ids := ARRAY(SELECT c.podcast_id FROM public.onde_membres_calcul((bl->>'mois')::date, _numero_id) c WHERE c.complet AND NOT c.deja);
  ELSE
    RETURN;
  END IF;
  RETURN QUERY SELECT * FROM public.onde_cartes_membres(ids);
END $$;
REVOKE EXECUTE ON FUNCTION public.onde_nouveaux_membres(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.onde_nouveaux_membres(uuid, text) TO anon, authenticated, service_role;

-- Ligne de suivi sous le bloc, dans l'admin : nombres et noms seulement, pour l'équipe de L'Onde.
CREATE OR REPLACE FUNCTION public.onde_nouveaux_membres_bilan(_numero_id uuid, _bloc_id text, _mois date)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  m date := date_trunc('month', _mois)::date;
  bl jsonb;
  fige uuid[];
  fige_mails text[] := '{}';
  res jsonb;
BEGIN
  IF NOT public.peut_editer_onde() THEN
    RAISE EXCEPTION 'Réservé à l''équipe de L''Onde.' USING ERRCODE = '42501';
  END IF;
  IF m IS NULL THEN RETURN NULL; END IF;
  SELECT x.value INTO bl FROM public.onde_numeros o CROSS JOIN LATERAL jsonb_array_elements(o.blocs) x
    WHERE o.id = _numero_id AND x.value->>'id' = _bloc_id AND x.value->>'type' = 'nouveaux_membres' LIMIT 1;
  IF bl IS NOT NULL AND jsonb_typeof(bl->'membres') = 'array' AND (bl->>'mois')::date = m THEN
    fige := ARRAY(SELECT v::uuid FROM jsonb_array_elements_text(bl->'membres') v);
    fige_mails := ARRAY(SELECT DISTINCT lower(p.email) FROM public.podcasts p WHERE p.id = ANY(fige));
  END IF;

  SELECT jsonb_build_object(
    'nouveaux', count(*) FILTER (WHERE c.du_mois),
    'fige', fige IS NOT NULL,
    'affiches', CASE WHEN fige IS NOT NULL
      THEN coalesce((SELECT jsonb_agg(nullif(btrim(concat_ws(' ', k.prenom, k.nom)), '')) FROM public.onde_cartes_membres(fige) k), '[]'::jsonb)
      ELSE coalesce(jsonb_agg(c.nom ORDER BY lower(c.nom)) FILTER (WHERE c.complet AND NOT c.deja), '[]'::jsonb) END,
    'reportes', CASE WHEN fige IS NOT NULL THEN 0
      ELSE count(*) FILTER (WHERE c.complet AND NOT c.deja AND NOT c.du_mois) END,
    'deja', count(*) FILTER (WHERE c.deja AND c.du_mois),
    'en_attente', coalesce(jsonb_agg(c.nom ORDER BY lower(c.nom)) FILTER (WHERE NOT c.deja AND NOT (c.email = ANY(fige_mails)) AND (fige IS NOT NULL OR NOT c.complet)), '[]'::jsonb)
  ) INTO res
  FROM public.onde_membres_calcul(m, _numero_id) c;
  RETURN res;
END $$;
REVOKE EXECUTE ON FUNCTION public.onde_nouveaux_membres_bilan(uuid, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onde_nouveaux_membres_bilan(uuid, text, date) TO authenticated, service_role;

-- Vérification de chaque enregistrement (inchangée), plus : à la publication, la liste des nouveaux membres
-- est arrêtée et gardée dans le bloc. Elle sert de trace : une personne affichée ne revient dans aucun autre numéro.
-- Une liste déjà arrêtée est conservée tant que le mois du bloc ne change pas (ce que le navigateur envoie est ignoré).
CREATE OR REPLACE FUNCTION public.guard_onde_numeros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  publier boolean;
  propre jsonb := '[]'::jsonb;
  el jsonb;
  ancien jsonb;
  i integer := 0;
  noms text[] := ARRAY['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
BEGIN
  IF NEW.statut IS NULL OR NEW.statut NOT IN ('brouillon', 'publie') THEN
    RAISE EXCEPTION 'Statut inconnu.' USING ERRCODE = 'P0001';
  END IF;
  publier := NEW.statut = 'publie';

  IF NEW.numero IS NULL OR NEW.numero < 1 OR NEW.numero > 9999 THEN
    RAISE EXCEPTION 'Le numéro doit être un nombre entier, à partir de 1.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.mois IS NULL THEN
    RAISE EXCEPTION 'Choisissez le mois du numéro.' USING ERRCODE = 'P0001';
  END IF;
  NEW.mois := date_trunc('month', NEW.mois)::date;

  NEW.titre := coalesce(public.onde_txt(NEW.titre, 120, 'Titre', publier), '');
  NEW.chapeau := coalesce(public.onde_txt(NEW.chapeau, 240, 'Chapeau', publier), '');
  NEW.couverture_url := public.onde_fichier(NEW.couverture_url, 'Photo de couverture', publier);
  NEW.couverture_alt := public.onde_txt(NEW.couverture_alt, 250, 'Texte alternatif de la couverture', publier);
  NEW.audio_url := public.onde_fichier(NEW.audio_url, 'Version audio', false);
  NEW.audio_voix := public.onde_txt(NEW.audio_voix, 80, 'Voix du mois', publier AND NEW.audio_url IS NOT NULL);

  IF NEW.blocs IS NULL THEN NEW.blocs := '[]'::jsonb; END IF;
  IF jsonb_typeof(NEW.blocs) <> 'array' THEN
    RAISE EXCEPTION 'Les blocs sont mal formés.' USING ERRCODE = 'P0001';
  END IF;
  IF jsonb_array_length(NEW.blocs) > 30 THEN
    RAISE EXCEPTION 'Un numéro contient 30 blocs au maximum.' USING ERRCODE = 'P0001';
  END IF;
  FOR el IN SELECT value FROM jsonb_array_elements(NEW.blocs) LOOP
    i := i + 1;
    el := public.onde_bloc_propre(el, publier, i);
    IF el->>'type' = 'nouveaux_membres' THEN
      ancien := NULL;
      IF TG_OP = 'UPDATE' THEN
        SELECT x.value INTO ancien FROM jsonb_array_elements(OLD.blocs) x
          WHERE x.value->>'id' = el->>'id' AND x.value->>'type' = 'nouveaux_membres' LIMIT 1;
      END IF;
      IF ancien IS NOT NULL AND jsonb_typeof(ancien->'membres') = 'array' AND ancien->>'mois' IS NOT DISTINCT FROM el->>'mois' THEN
        el := el || jsonb_build_object('membres', ancien->'membres');
      ELSIF publier AND el->>'mois' IS NOT NULL THEN
        el := el || jsonb_build_object('membres', coalesce(
          (SELECT jsonb_agg(c.podcast_id ORDER BY lower(c.nom)) FROM public.onde_membres_calcul((el->>'mois')::date, NEW.id) c WHERE c.complet AND NOT c.deja),
          '[]'::jsonb));
      END IF;
    END IF;
    propre := propre || jsonb_build_array(el);
  END LOOP;
  NEW.blocs := propre;

  IF TG_OP = 'INSERT' THEN
    NEW.auteur_id := auth.uid();
    NEW.created_at := now();
    NEW.publie_le := CASE WHEN publier THEN now() ELSE NULL END;
  ELSE
    NEW.auteur_id := OLD.auteur_id;
    NEW.created_at := OLD.created_at;
    -- Date de première publication, gardée si le numéro est dépublié puis republié
    NEW.publie_le := coalesce(OLD.publie_le, CASE WHEN publier THEN now() ELSE NULL END);
  END IF;

  -- Adresse du numéro (/onde/n1-decembre-2026) : fixée à la première publication, pour ne casser aucun lien partagé.
  IF TG_OP = 'INSERT' OR OLD.publie_le IS NULL THEN
    NEW.slug := 'n' || NEW.numero || '-' || noms[extract(month FROM NEW.mois)::int] || '-' || extract(year FROM NEW.mois)::int;
  ELSE
    NEW.slug := OLD.slug;
  END IF;

  NEW.modifie_par := auth.uid();
  NEW.updated_at := now();
  RETURN NEW;
END
$function$;