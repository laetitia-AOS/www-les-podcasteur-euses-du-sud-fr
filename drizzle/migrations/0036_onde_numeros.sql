-- L'Onde du Sud, la lettre mensuelle des Podcasteur·euses du Sud : un numéro par mois, publié sur le site.
-- Lecture publique des numéros publiés ; brouillons, création, modification et publication réservées
-- aux admins et aux éditeur·ices (rôle « editeur ») ; suppression réservée aux admins.
-- Tout texte est nettoyé côté serveur par le déclencheur guard_onde_numeros, quel que soit le rôle.

-- Qui peut rédiger L'Onde : admins et éditeur·ices.
CREATE OR REPLACE FUNCTION public.peut_editer_onde()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.uid() AND r.role IN ('admin'::public.app_role, 'editeur'::public.app_role)
  )
$$;
GRANT EXECUTE ON FUNCTION public.peut_editer_onde() TO anon, authenticated, service_role;

-- Nettoyage d'un texte : balises HTML retirées, caractères de contrôle retirés, longueur limitée.
CREATE OR REPLACE FUNCTION public.onde_txt(v text, maxlen integer, label text, required boolean DEFAULT false)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT public.pds_txt(regexp_replace(coalesce(v, ''), '</?[a-zA-Z!][^>]*>', '', 'g'), maxlen, label, required)
$$;

-- Texte mis en forme : **gras**, *italique*, [lien](https://…) seulement. Un lien vers autre chose
-- qu'une adresse https://, http:// ou une page du site (/…) est remplacé par son seul texte.
CREATE OR REPLACE FUNCTION public.onde_texte_riche(v text, maxlen integer, label text, required boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE s text := public.onde_txt(v, maxlen, label, required);
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  RETURN regexp_replace(s, '\[([^\]]*)\]\(\s*(?!https?://|/[^/])[^)]*\)', '\1', 'g');
END $$;

-- Lien d'un bouton ou d'un épisode complet : https://… ou une page du site (/…).
CREATE OR REPLACE FUNCTION public.onde_lien(v text, label text, required boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE s text := public.onde_txt(v, 500, label, required);
BEGIN
  IF s IS NOT NULL AND s !~* '^(https?://[^\s<>"]+|/([^/\s<>"][^\s<>"]*)?)$' THEN
    RAISE EXCEPTION 'Le lien « % » doit commencer par https:// (ou par / pour une page du site).', label USING ERRCODE = 'P0001';
  END IF;
  RETURN s;
END $$;

-- Fichier (photo, MP3) : uniquement un fichier déposé dans l'espace de stockage de L'Onde.
CREATE OR REPLACE FUNCTION public.onde_fichier(v text, label text, required boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE s text := public.pds_txt(v, 600, label, required);
BEGIN
  IF s IS NOT NULL AND s !~ '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/onde/[A-Za-z0-9/._-]+$' THEN
    RAISE EXCEPTION 'Le fichier « % » doit être envoyé depuis l''éditeur de L''Onde.', label USING ERRCODE = 'P0001';
  END IF;
  RETURN s;
END $$;

-- Un bloc nettoyé : seuls les champs prévus pour son type sont gardés.
-- « publier » : au moment de la publication, les champs nécessaires deviennent obligatoires.
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

  ELSIF t = 'chiffres' THEN
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

  ELSE
    RAISE EXCEPTION 'Le % a un type inconnu.', lab USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_strip_nulls(out);
END $$;

CREATE TABLE public.onde_numeros (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero integer NOT NULL,
  mois date NOT NULL,
  titre text NOT NULL DEFAULT '',
  chapeau text NOT NULL DEFAULT '',
  slug text NOT NULL,
  couverture_url text,
  couverture_alt text,
  audio_url text,
  audio_voix text,
  blocs jsonb NOT NULL DEFAULT '[]'::jsonb,
  statut text NOT NULL DEFAULT 'brouillon',
  publie_le timestamp with time zone,
  auteur_id uuid,
  modifie_par uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT onde_numeros_pkey PRIMARY KEY (id),
  CONSTRAINT onde_numeros_numero_key UNIQUE (numero),
  CONSTRAINT onde_numeros_slug_key UNIQUE (slug),
  CONSTRAINT onde_numeros_statut_valide CHECK (statut IN ('brouillon', 'publie')),
  CONSTRAINT onde_numeros_numero_positif CHECK (numero BETWEEN 1 AND 9999)
);

COMMENT ON TABLE public.onde_numeros IS 'L''Onde du Sud : numéros de la lettre mensuelle. Publiés lisibles par tous, brouillons réservés aux admins et éditeur·ices.';

CREATE INDEX onde_numeros_publies_idx ON public.onde_numeros (statut, mois DESC);

-- Les visiteur·ices ne lisent que les colonnes utiles à la page (pas les identifiants des auteur·ices).
GRANT SELECT (id, numero, mois, titre, chapeau, slug, couverture_url, couverture_alt, audio_url, audio_voix, blocs, statut, publie_le, updated_at)
  ON public.onde_numeros TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onde_numeros TO authenticated;
GRANT ALL ON public.onde_numeros TO service_role;

ALTER TABLE public.onde_numeros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Numéros publiés lisibles par tous"
  ON public.onde_numeros FOR SELECT TO anon, authenticated
  USING (statut = 'publie');

CREATE POLICY "Équipe de L'Onde lit aussi les brouillons"
  ON public.onde_numeros FOR SELECT TO authenticated
  USING (public.peut_editer_onde());

CREATE POLICY "Équipe de L'Onde crée les numéros"
  ON public.onde_numeros FOR INSERT TO authenticated
  WITH CHECK (public.peut_editer_onde());

CREATE POLICY "Équipe de L'Onde modifie et publie"
  ON public.onde_numeros FOR UPDATE TO authenticated
  USING (public.peut_editer_onde())
  WITH CHECK (public.peut_editer_onde());

CREATE POLICY "Seuls les admins suppriment un numéro"
  ON public.onde_numeros FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Vérification et nettoyage de chaque enregistrement, adresse du numéro, dates et auteur·ice.
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
    propre := propre || jsonb_build_array(public.onde_bloc_propre(el, publier, i));
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

CREATE TRIGGER guard_onde_numeros
  BEFORE INSERT OR UPDATE ON public.onde_numeros
  FOR EACH ROW EXECUTE FUNCTION public.guard_onde_numeros();

-- Noms affichés dans l'admin pour « créé par » / « modifié par » (équipe de L'Onde seulement).
CREATE OR REPLACE FUNCTION public.onde_noms(_ids uuid[])
RETURNS TABLE(id uuid, nom text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.peut_editer_onde() THEN RETURN; END IF;
  RETURN QUERY
    SELECT u.id,
      coalesce(
        (SELECT nullif(btrim(concat_ws(' ', p.prenom, p.nom)), '') FROM public.podcasts p
          WHERE lower(p.email) = lower(u.email) AND nullif(btrim(concat_ws(' ', p.prenom, p.nom)), '') IS NOT NULL
          ORDER BY p.created_at LIMIT 1),
        split_part(u.email::text, '@', 1)
      )
    FROM auth.users u
    WHERE u.id = ANY(_ids);
END $$;
GRANT EXECUTE ON FUNCTION public.onde_noms(uuid[]) TO authenticated;

-- Éditeur·ices de L'Onde : liste, ajout et retrait, réservés aux admins.
CREATE OR REPLACE FUNCTION public.onde_editeurs()
RETURNS TABLE(user_id uuid, email text, nom text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RETURN; END IF;
  RETURN QUERY
    SELECT r.user_id, u.email::text,
      (SELECT nullif(btrim(concat_ws(' ', p.prenom, p.nom)), '') FROM public.podcasts p
        WHERE lower(p.email) = lower(u.email) AND nullif(btrim(concat_ws(' ', p.prenom, p.nom)), '') IS NOT NULL
        ORDER BY p.created_at LIMIT 1)
    FROM public.user_roles r
    JOIN auth.users u ON u.id = r.user_id
    WHERE r.role = 'editeur'::public.app_role
    ORDER BY u.email;
END $$;
GRANT EXECUTE ON FUNCTION public.onde_editeurs() TO authenticated;

CREATE OR REPLACE FUNCTION public.onde_donner_editeur(_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE uid uuid; mail text := lower(btrim(coalesce(_email, '')));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Seul·e un·e admin peut donner ce rôle.' USING ERRCODE = '42501';
  END IF;
  IF mail = '' THEN
    RAISE EXCEPTION 'Indiquez l''adresse e-mail du ou de la membre.' USING ERRCODE = 'P0001';
  END IF;
  SELECT u.id INTO uid FROM auth.users u WHERE lower(u.email) = mail LIMIT 1;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Aucun compte avec cette adresse : la personne doit d''abord s''être connectée une fois à l''espace membre.' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'editeur'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN mail;
END $$;
GRANT EXECUTE ON FUNCTION public.onde_donner_editeur(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.onde_retirer_editeur(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Seul·e un·e admin peut retirer ce rôle.' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'editeur'::public.app_role;
  RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.onde_retirer_editeur(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.onde_editeurs() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.onde_donner_editeur(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.onde_retirer_editeur(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.onde_noms(uuid[]) FROM anon, public;