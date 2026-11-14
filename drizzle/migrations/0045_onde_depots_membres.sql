-- L'Onde du Sud, lot 5 : les dépôts des membres.
-- Les adhérent·es à jour déposent un son (MP3 ou lien), un texte et une photo ; l'équipe de L'Onde pioche chaque mois.
-- Aucun accès direct à la table : le dépôt passe par la fonction serveur « onde-depot », les lectures par des fonctions
-- limitées à l'adresse connectée (membre) ou à l'équipe (admins et éditeur·ices). Les fichiers sont dans l'espace privé
-- « onde » (dossier depots/<dépôt>) et ne sont servis au public qu'une fois le dépôt publié dans un numéro.

CREATE TABLE public.onde_depots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  podcast_id uuid REFERENCES public.podcasts(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('son', 'ecoute', 'projet', 'coulisses', 'appel')),
  titre text NOT NULL,
  texte text NOT NULL,
  audio_url text,
  lien_ecoute text,
  photo_url text,
  droits boolean NOT NULL DEFAULT false,
  accord_publication boolean NOT NULL DEFAULT false,
  consentement_le timestamptz,
  statut text NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'retenu', 'plus_tard', 'pas_retenu')),
  numero_id uuid REFERENCES public.onde_numeros(id) ON DELETE SET NULL,
  notifie_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.onde_depots IS 'Dépôts des membres pour L''Onde du Sud. Écriture par la fonction serveur onde-depot (membres à jour) et par les fonctions de l''équipe ; aucune lecture directe.';
CREATE INDEX onde_depots_email_date ON public.onde_depots (lower(email), created_at);
CREATE INDEX onde_depots_date ON public.onde_depots (created_at DESC);

REVOKE ALL ON public.onde_depots FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.onde_depots TO service_role;
ALTER TABLE public.onde_depots ENABLE ROW LEVEL SECURITY;

-- Étiquette de rubrique proposée selon ce qui est déposé
CREATE OR REPLACE FUNCTION public.onde_etiquette_depot(_type text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$
  SELECT CASE _type
    WHEN 'son' THEN 'À l''écoute'
    WHEN 'ecoute' THEN 'Une écoute recommandée'
    WHEN 'projet' THEN 'En fabrication'
    WHEN 'coulisses' THEN 'Les coulisses'
    WHEN 'appel' THEN 'Dans notre agenda'
    ELSE 'Déposé par un·e membre' END
$$;

-- Vérification et nettoyage de chaque dépôt, quel que soit le chemin d'écriture
CREATE OR REPLACE FUNCTION public.guard_onde_depots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base text := '^https://[a-z0-9-]+\.supabase\.co/functions/v1/onde-media/depots/' || NEW.id::text || '/[A-Za-z0-9_-]+\.';
  nb integer;
  debut_mois timestamptz := date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
BEGIN
  NEW.email := public.pds_email(NEW.email, true);
  IF NEW.type IS NULL OR NEW.type NOT IN ('son', 'ecoute', 'projet', 'coulisses', 'appel') THEN
    RAISE EXCEPTION 'Choisissez ce que vous déposez.' USING ERRCODE = 'P0001';
  END IF;
  NEW.titre := public.onde_txt(NEW.titre, 120, 'Titre', true);
  NEW.texte := public.onde_txt(NEW.texte, 500, 'Quelques lignes', true);
  NEW.lien_ecoute := public.pds_url(NEW.lien_ecoute, 'Lien d''écoute', 500);
  NEW.audio_url := nullif(btrim(coalesce(NEW.audio_url, '')), '');
  NEW.photo_url := nullif(btrim(coalesce(NEW.photo_url, '')), '');
  IF NEW.audio_url IS NOT NULL AND NEW.audio_url !~ (base || 'mp3$') THEN
    RAISE EXCEPTION 'Le fichier MP3 doit être envoyé depuis le formulaire de dépôt.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.photo_url IS NOT NULL AND NEW.photo_url !~ (base || '(jpg|png|webp)$') THEN
    RAISE EXCEPTION 'La photo doit être envoyée depuis le formulaire de dépôt.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.audio_url IS NULL AND NEW.lien_ecoute IS NULL THEN
    RAISE EXCEPTION 'Ajoutez le son : un fichier MP3 ou un lien d''écoute.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT coalesce(NEW.droits, false) OR NOT coalesce(NEW.accord_publication, false) THEN
    RAISE EXCEPTION 'Cochez les deux cases : vos droits sur ce son et votre accord pour la publication.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.statut IS NULL OR NEW.statut NOT IN ('nouveau', 'retenu', 'plus_tard', 'pas_retenu') THEN
    RAISE EXCEPTION 'Statut inconnu.' USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT public.membre_a_jour(NEW.email) THEN
      RAISE EXCEPTION 'Le dépôt pour L''Onde du Sud est réservé aux adhérent·es à jour.' USING ERRCODE = '42501';
    END IF;
    -- Fiche du profil (pour le nom et le lien « Déposé par ») : la fiche de la personne, avant ses podcasts
    NEW.podcast_id := (SELECT p.id FROM public.podcasts p
      WHERE lower(p.email) = NEW.email ORDER BY (p.type_profil = 'podcasteur'), p.created_at LIMIT 1);
    IF NEW.podcast_id IS NULL THEN
      RAISE EXCEPTION 'Créez d''abord votre profil dans l''espace membre.' USING ERRCODE = 'P0001';
    END IF;
    SELECT count(*) INTO nb FROM public.onde_depots d WHERE lower(d.email) = NEW.email AND d.created_at >= debut_mois;
    IF nb >= 10 THEN
      RAISE EXCEPTION 'Vous avez déjà fait 10 dépôts ce mois-ci : c''est le maximum. Rendez-vous le mois prochain.' USING ERRCODE = 'P0001', HINT = 'rate_limit';
    END IF;
    NEW.statut := 'nouveau';
    NEW.numero_id := NULL;
    NEW.notifie_le := NULL;
    NEW.created_at := now();
    NEW.consentement_le := now();
  ELSE
    NEW.email := OLD.email;
    NEW.created_at := OLD.created_at;
    -- La fiche ne change jamais, sauf si elle disparaît (fiche supprimée)
    IF NEW.podcast_id IS NOT NULL THEN NEW.podcast_id := OLD.podcast_id; END IF;
    IF (NEW.titre, NEW.texte, NEW.audio_url, NEW.lien_ecoute, NEW.photo_url) IS DISTINCT FROM (OLD.titre, OLD.texte, OLD.audio_url, OLD.lien_ecoute, OLD.photo_url) THEN
      NEW.consentement_le := now();
    ELSE
      NEW.consentement_le := OLD.consentement_le;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_onde_depots() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_onde_depots BEFORE INSERT OR UPDATE ON public.onde_depots
  FOR EACH ROW EXECUTE FUNCTION public.guard_onde_depots();

-- Numéro publié où un dépôt apparaît (aucun : pas encore publié)
CREATE OR REPLACE FUNCTION public.onde_depot_publie(_id uuid)
RETURNS TABLE(numero_id uuid, mois date, slug text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT o.id, o.mois, o.slug FROM public.onde_numeros o
  WHERE o.statut = 'publie' AND o.blocs @> jsonb_build_array(jsonb_build_object('type', 'depot', 'depot_id', _id::text))
  ORDER BY o.publie_le NULLS LAST LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.onde_depot_publie(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.onde_depot_publie(uuid) TO service_role;

-- Qui peut déposer : adhérent·e à jour avec un profil (même règle d'adhésion que le reste du site)
CREATE OR REPLACE FUNCTION public.peut_deposer_onde()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') <> ''
    AND public.membre_a_jour(auth.jwt() ->> 'email')
    AND EXISTS (SELECT 1 FROM public.podcasts p WHERE lower(p.email) = lower(auth.jwt() ->> 'email'))
$$;
REVOKE ALL ON FUNCTION public.peut_deposer_onde() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.peut_deposer_onde() TO authenticated, service_role;

-- Les dépôts de la personne connectée, et seulement les siens
CREATE OR REPLACE FUNCTION public.mes_depots_onde()
RETURNS TABLE(id uuid, type text, titre text, texte text, audio_url text, lien_ecoute text, photo_url text,
  statut text, created_at timestamptz, updated_at timestamptz, publie_mois date, publie_slug text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT d.id, d.type, d.titre, d.texte, d.audio_url, d.lien_ecoute, d.photo_url, d.statut, d.created_at, d.updated_at, p.mois, p.slug
  FROM public.onde_depots d
  LEFT JOIN LATERAL public.onde_depot_publie(d.id) p ON true
  WHERE coalesce(auth.jwt() ->> 'email', '') <> '' AND lower(d.email) = lower(auth.jwt() ->> 'email')
  ORDER BY d.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.mes_depots_onde() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mes_depots_onde() TO authenticated, service_role;

-- Fichier d'un dépôt, lisible par son auteur·ice (écoute de son propre son avant publication)
CREATE OR REPLACE FUNCTION public.mon_depot_onde(_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') <> '' AND EXISTS (
    SELECT 1 FROM public.onde_depots d WHERE d.id::text = _id AND lower(d.email) = lower(auth.jwt() ->> 'email'))
$$;
REVOKE ALL ON FUNCTION public.mon_depot_onde(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_depot_onde(text) TO authenticated;

CREATE POLICY "Membre lit les fichiers de ses dépôts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'onde' AND (storage.foldername(name))[1] = 'depots' AND public.mon_depot_onde((storage.foldername(name))[2]));

-- Liste pour l'équipe de L'Onde (admins et éditeur·ices) : pas d'adresse e-mail, seulement le nom et la fiche
CREATE OR REPLACE FUNCTION public.onde_depots_equipe()
RETURNS TABLE(id uuid, type text, titre text, texte text, audio_url text, lien_ecoute text, photo_url text,
  statut text, created_at timestamptz, updated_at timestamptz,
  prenom text, nom text, fiche_id uuid, fiche_slug text, fiche_type text, fiche_nom_podcast text, fiche_visible boolean,
  numero_id uuid, numero integer, numero_mois date, numero_statut text, publie boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT d.id, d.type, d.titre, d.texte, d.audio_url, d.lien_ecoute, d.photo_url, d.statut, d.created_at, d.updated_at,
    p.prenom, p.nom, p.id, p.slug, p.type_profil, p.nom_podcast, coalesce(public.podcast_visible(p.id), false),
    o.id, o.numero, o.mois, o.statut,
    EXISTS (SELECT 1 FROM public.onde_depot_publie(d.id))
  FROM public.onde_depots d
  LEFT JOIN public.podcasts p ON p.id = d.podcast_id
  LEFT JOIN public.onde_numeros o ON o.id = d.numero_id
  WHERE public.peut_editer_onde()
  ORDER BY d.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.onde_depots_equipe() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onde_depots_equipe() TO authenticated;

CREATE OR REPLACE FUNCTION public.onde_depot_statut(_id uuid, _statut text)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.peut_editer_onde() THEN RAISE EXCEPTION 'Réservé à l''équipe de L''Onde.' USING ERRCODE = '42501'; END IF;
  IF _statut IS NULL OR _statut NOT IN ('nouveau', 'retenu', 'plus_tard', 'pas_retenu') THEN
    RAISE EXCEPTION 'Statut inconnu.' USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.onde_depots SET statut = _statut WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ce dépôt n''existe plus : il a peut-être été retiré par son auteur·ice.' USING ERRCODE = 'P0001'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.onde_depot_statut(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onde_depot_statut(uuid, text) TO authenticated;

-- « Utiliser dans un numéro » : ajoute en fin de brouillon un bloc déjà rempli (étiquette, titre, texte, son, photo),
-- relié au dépôt. Le nom « Déposé par » est relu à chaque affichage (onde_credits_depots), jamais recopié.
CREATE OR REPLACE FUNCTION public.onde_utiliser_depot(_depot_id uuid, _numero_id uuid)
RETURNS text LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  d public.onde_depots;
  st text;
  bid text := gen_random_uuid()::text;
  bl jsonb;
BEGIN
  IF NOT public.peut_editer_onde() THEN RAISE EXCEPTION 'Réservé à l''équipe de L''Onde.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO d FROM public.onde_depots WHERE id = _depot_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Ce dépôt n''existe plus : il a peut-être été retiré par son auteur·ice.' USING ERRCODE = 'P0001'; END IF;
  SELECT o.statut INTO st FROM public.onde_numeros o WHERE o.id = _numero_id FOR UPDATE;
  IF st IS NULL THEN RAISE EXCEPTION 'Numéro introuvable.' USING ERRCODE = 'P0001'; END IF;
  IF st <> 'brouillon' THEN RAISE EXCEPTION 'Choisissez un numéro en brouillon.' USING ERRCODE = 'P0001'; END IF;
  IF EXISTS (SELECT 1 FROM public.onde_numeros o WHERE o.id = _numero_id
             AND o.blocs @> jsonb_build_array(jsonb_build_object('type', 'depot', 'depot_id', _depot_id::text))) THEN
    RAISE EXCEPTION 'Ce dépôt est déjà dans ce numéro.' USING ERRCODE = 'P0001';
  END IF;
  bl := jsonb_strip_nulls(jsonb_build_object(
    'id', bid, 'type', 'depot', 'depot_id', d.id::text,
    'rubrique', public.onde_etiquette_depot(d.type),
    'titre', d.titre, 'texte', d.texte, 'url', d.audio_url, 'lien', d.lien_ecoute,
    'photo', CASE WHEN d.photo_url IS NULL THEN NULL ELSE jsonb_build_object('url', d.photo_url, 'alt', '') END
  ));
  UPDATE public.onde_numeros SET blocs = coalesce(blocs, '[]'::jsonb) || jsonb_build_array(bl) WHERE id = _numero_id;
  UPDATE public.onde_depots SET statut = 'retenu', numero_id = _numero_id WHERE id = d.id;
  RETURN bid;
END $$;
REVOKE ALL ON FUNCTION public.onde_utiliser_depot(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onde_utiliser_depot(uuid, uuid) TO authenticated;

-- « Déposé par » d'un numéro : nom et fiche (fiche visible seulement). Publié : tout le monde ; brouillon : l'équipe.
CREATE OR REPLACE FUNCTION public.onde_credits_depots(_numero_id uuid)
RETURNS TABLE(depot_id uuid, prenom text, nom text, fiche_id uuid, slug text, type_profil text, nom_podcast text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
#variable_conflict use_column
DECLARE st text; bl jsonb;
BEGIN
  SELECT o.statut, o.blocs INTO st, bl FROM public.onde_numeros o WHERE o.id = _numero_id;
  IF st IS NULL THEN RETURN; END IF;
  IF st <> 'publie' AND NOT public.peut_editer_onde() THEN RETURN; END IF;
  RETURN QUERY
  SELECT d.id, p.prenom, p.nom,
    CASE WHEN public.podcast_visible(p.id) THEN p.id END,
    CASE WHEN public.podcast_visible(p.id) THEN p.slug END,
    CASE WHEN public.podcast_visible(p.id) THEN p.type_profil END,
    CASE WHEN public.podcast_visible(p.id) THEN p.nom_podcast END
  FROM public.onde_depots d
  JOIN public.podcasts p ON p.id = d.podcast_id
  WHERE d.id::text IN (SELECT x.value->>'depot_id' FROM jsonb_array_elements(coalesce(bl, '[]'::jsonb)) x WHERE x.value->>'type' = 'depot');
END $$;
REVOKE ALL ON FUNCTION public.onde_credits_depots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.onde_credits_depots(uuid) TO anon, authenticated, service_role;

-- Nombre de dépôts reçus ce mois-ci (heure de Paris) : un seul chiffre, pour l'encart des numéros et l'admin
CREATE OR REPLACE FUNCTION public.onde_depots_ce_mois()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT count(*)::int FROM public.onde_depots
  WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris'
$$;
REVOKE ALL ON FUNCTION public.onde_depots_ce_mois() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.onde_depots_ce_mois() TO anon, authenticated, service_role;

-- Retour au déposant : dépôts « Retenu » d'un numéro envoyé, pas encore prévenus (serveur seulement)
CREATE OR REPLACE FUNCTION public.onde_depots_a_notifier(_numero_id uuid)
RETURNS TABLE(id uuid, email text, titre text, type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT d.id, d.email, d.titre, d.type
  FROM public.onde_depots d
  JOIN public.onde_numeros o ON o.id = _numero_id AND o.statut = 'publie'
  WHERE d.statut = 'retenu' AND d.notifie_le IS NULL
    AND o.blocs @> jsonb_build_array(jsonb_build_object('type', 'depot', 'depot_id', d.id::text))
    AND EXISTS (SELECT 1 FROM public.onde_envois e WHERE e.numero_id = _numero_id)
$$;
CREATE OR REPLACE FUNCTION public.onde_depot_notifie(_id uuid)
RETURNS void LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$ UPDATE public.onde_depots SET notifie_le = now() WHERE id = _id AND notifie_le IS NULL $$;
REVOKE ALL ON FUNCTION public.onde_depots_a_notifier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.onde_depot_notifie(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.onde_depots_a_notifier(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.onde_depot_notifie(uuid) TO service_role;

-- Bloc « dépôt » d'un numéro : seuls les champs prévus, fichiers du dépôt seulement.
-- À la publication, un bloc dont le dépôt a été retiré par son auteur·ice est refusé.
CREATE OR REPLACE FUNCTION public.onde_bloc_depot(b jsonb, publier boolean, n integer)
RETURNS jsonb LANGUAGE plpgsql SET search_path TO 'public'
AS $$
DECLARE
  lab text := 'bloc ' || n;
  bid text;
  did text;
  ph jsonb;
  f text;
  out jsonb;
  base text;
BEGIN
  bid := left(regexp_replace(coalesce(b->>'id', ''), '[^A-Za-z0-9-]', '', 'g'), 40);
  IF bid = '' THEN bid := gen_random_uuid()::text; END IF;
  did := lower(btrim(coalesce(b->>'depot_id', '')));
  IF did !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Le % est mal formé.', lab USING ERRCODE = 'P0001';
  END IF;
  IF publier AND NOT EXISTS (SELECT 1 FROM public.onde_depots d WHERE d.id = did::uuid) THEN
    RAISE EXCEPTION 'Le dépôt du % a été retiré par son auteur·ice : supprimez ce bloc avant de publier.', lab USING ERRCODE = 'P0001';
  END IF;
  base := '^https://[a-z0-9-]+\.supabase\.co/functions/v1/onde-media/depots/' || did || '/[A-Za-z0-9_-]+\.';
  out := jsonb_build_object(
    'id', bid, 'type', 'depot', 'depot_id', did,
    'rubrique', public.onde_txt(b->>'rubrique', 60, 'Rubrique du ' || lab, publier),
    'titre', public.onde_txt(b->>'titre', 120, 'Titre du ' || lab, publier),
    'texte', public.onde_texte_riche(b->>'texte', 1500, 'Texte du ' || lab, false),
    'lien', public.onde_lien(b->>'lien', 'Lien d''écoute du ' || lab, false)
  );
  f := nullif(btrim(coalesce(b->>'url', '')), '');
  IF f IS NOT NULL THEN
    IF f !~ (base || 'mp3$') THEN RAISE EXCEPTION 'Le son du % doit venir du dépôt.', lab USING ERRCODE = 'P0001'; END IF;
    out := out || jsonb_build_object('url', f);
  END IF;
  ph := b->'photo';
  IF jsonb_typeof(ph) = 'object' AND nullif(btrim(coalesce(ph->>'url', '')), '') IS NOT NULL THEN
    f := btrim(ph->>'url');
    IF f !~ (base || '(jpg|png|webp)$') THEN RAISE EXCEPTION 'La photo du % doit venir du dépôt.', lab USING ERRCODE = 'P0001'; END IF;
    out := out || jsonb_build_object('photo', jsonb_strip_nulls(jsonb_build_object(
      'url', f, 'alt', public.onde_txt(ph->>'alt', 250, 'Texte alternatif de la photo du ' || lab, publier))));
  END IF;
  RETURN jsonb_strip_nulls(out);
END $$;
REVOKE ALL ON FUNCTION public.onde_bloc_depot(jsonb, boolean, integer) FROM PUBLIC, anon, authenticated;

-- Vérification des numéros : le bloc « dépôt » en plus (le reste est inchangé)
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
  -- Durée de la version audio (en secondes), lue par l'éditeur ; effacée avec le MP3
  IF NEW.audio_url IS NULL OR NEW.audio_duree IS NULL OR NEW.audio_duree < 1 OR NEW.audio_duree > 36000 THEN
    NEW.audio_duree := NULL;
  END IF;

  IF NEW.blocs IS NULL THEN NEW.blocs := '[]'::jsonb; END IF;
  IF jsonb_typeof(NEW.blocs) <> 'array' THEN
    RAISE EXCEPTION 'Les blocs sont mal formés.' USING ERRCODE = 'P0001';
  END IF;
  IF jsonb_array_length(NEW.blocs) > 30 THEN
    RAISE EXCEPTION 'Un numéro contient 30 blocs au maximum.' USING ERRCODE = 'P0001';
  END IF;
  FOR el IN SELECT value FROM jsonb_array_elements(NEW.blocs) LOOP
    i := i + 1;
    -- Lot 4 : résumé facultatif pour l'e-mail (texte simple, 300 caractères)
    ancien := el;
    -- Lot 5 : bloc « dépôt » d'un·e membre
    IF jsonb_typeof(el) = 'object' AND el->>'type' = 'depot' THEN
      el := public.onde_bloc_depot(el, publier, i);
    ELSE
      el := public.onde_bloc_propre(el, publier, i);
    END IF;
    IF public.onde_txt(ancien->>'resume', 300, 'Résumé pour l''e-mail du bloc ' || i, false) IS NOT NULL THEN
      el := el || jsonb_build_object('resume', public.onde_txt(ancien->>'resume', 300, 'Résumé pour l''e-mail du bloc ' || i, false));
    END IF;
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

-- Suppression des données d'un·e membre à sa demande : ses dépôts partent aussi (fichiers effacés par la fonction serveur)
CREATE OR REPLACE FUNCTION public.effacer_donnees_membre(_email text)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE m text := lower(trim(coalesce(_email, ''))); ids uuid[]; images text[];
BEGIN
  IF m = '' OR position('@' in m) = 0 THEN RAISE EXCEPTION 'Adresse invalide.'; END IF;
  SELECT coalesce(array_agg(p.id), '{}') INTO ids FROM public.podcasts p WHERE lower(p.email) = m;

  -- Images publiques à retirer du stockage, sauf si une autre personne les utilise aussi
  SELECT coalesce(array_agg(DISTINCT x.u), '{}') INTO images FROM (
    SELECT unnest(ARRAY[p.vignette_url, p.photo_profil_url]) AS u FROM public.podcasts p WHERE p.id = ANY(ids)
    UNION ALL SELECT unnest(fl.photos) FROM public.fiches_lieux fl WHERE fl.podcast_id = ANY(ids)
    UNION ALL SELECT e.image_url FROM public.evenements e JOIN public.evenements_proposeurs ep ON ep.evenement_id = e.id
      WHERE lower(ep.email) = m AND e.statut <> 'publie'
  ) x
  WHERE x.u IS NOT NULL AND x.u <> ''
    AND NOT EXISTS (SELECT 1 FROM public.podcasts o WHERE lower(o.email) <> m AND (o.vignette_url = x.u OR o.photo_profil_url = x.u))
    AND NOT EXISTS (SELECT 1 FROM public.evenements e2 WHERE e2.image_url = x.u AND e2.statut = 'publie');

  DELETE FROM public.evenements e USING public.evenements_proposeurs ep
    WHERE ep.evenement_id = e.id AND lower(ep.email) = m AND e.statut <> 'publie';
  UPDATE public.evenements e SET propose_par = NULL, propose_par_nom = NULL
    FROM public.evenements_proposeurs ep WHERE ep.evenement_id = e.id AND lower(ep.email) = m;
  DELETE FROM public.evenements_proposeurs WHERE lower(email) = m;

  DELETE FROM public.evenement_inscriptions WHERE lower(email) = m;
  UPDATE public.contact_requests SET sender_name = 'Membre supprimé', sender_email = 'membre-supprime@invalid'
    WHERE lower(sender_email) = m;
  UPDATE public.demandes_devis SET nom = 'Membre supprimé', email = 'membre-supprime@invalid' WHERE lower(email) = m;
  DELETE FROM public.contacts WHERE lower(email) = m;
  DELETE FROM public.images_en_attente WHERE lower(email) = m;
  DELETE FROM public.onde_abonnes WHERE lower(email) = m;
  DELETE FROM public.onde_depots WHERE lower(email) = m;
  DELETE FROM public.adhesion_rattachements WHERE email_membre = m;
  DELETE FROM public.podcasts WHERE id = ANY(ids);
  UPDATE public.adhesions SET email = NULL, prenom = NULL, nom = NULL, telephone = NULL,
    raw_payload = jsonb_build_object('anonymise_le', now())
    WHERE lower(email) = m;
  RETURN images;
END $function$;