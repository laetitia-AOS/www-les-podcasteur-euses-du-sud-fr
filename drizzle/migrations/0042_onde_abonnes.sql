-- L'Onde du Sud, lot 3 : les abonné·es (aucun e-mail n'est envoyé ici).
-- La table n'est lisible par personne en direct : tout passe par les fonctions ci-dessous,
-- qui vérifient l'e-mail, le consentement, le jeton ou le rôle admin côté serveur.
CREATE TABLE public.onde_abonnes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  prenom text,
  source text NOT NULL DEFAULT 'onde' CHECK (source IN ('onde', 'evenement', 'adhesion')),
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'actif', 'desinscrit')),
  consentement_le timestamptz,
  consentement_texte text,
  jeton uuid NOT NULL DEFAULT gen_random_uuid(),
  confirme_le timestamptz,
  desinscrit_le timestamptz,
  essais integer NOT NULL DEFAULT 0,
  essais_depuis timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX onde_abonnes_email_key ON public.onde_abonnes (lower(email));
CREATE UNIQUE INDEX onde_abonnes_jeton_key ON public.onde_abonnes (jeton);
COMMENT ON TABLE public.onde_abonnes IS 'Abonné·es de L''Onde du Sud. Lecture et écriture uniquement par les fonctions onde_* (admins pour la liste).';
COMMENT ON COLUMN public.onde_abonnes.source IS 'onde = formulaire de L''Onde ; evenement = case du formulaire « Je viens » ; adhesion = adhérent·e inclus·e d''office (ligne créée au moment de l''envoi, lot 4).';

GRANT ALL ON public.onde_abonnes TO service_role;
ALTER TABLE public.onde_abonnes ENABLE ROW LEVEL SECURITY;
-- Aucune règle pour anon ni authenticated : aucune lecture ni écriture directe.

-- Textes de consentement, enregistrés tels quels avec la date.
CREATE OR REPLACE FUNCTION public.onde_texte_consentement(_source text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE _source
    WHEN 'onde' THEN 'J''accepte de recevoir L''Onde du Sud par e-mail. Je peux me désinscrire à tout moment.'
    WHEN 'evenement' THEN 'Je veux aussi recevoir L''Onde du Sud, la lettre mensuelle'
    WHEN 'reinscription' THEN 'Me réinscrire : je recevrai de nouveau L''Onde du Sud par e-mail et je peux me désinscrire à tout moment.'
  END
$$;

-- Inscription publique. Toujours la même réponse, pour ne jamais révéler si une adresse est déjà abonnée.
CREATE OR REPLACE FUNCTION public.onde_inscrire(_prenom text, _email text, _consentement boolean, _source text)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  m text;
  p text;
  t text;
  r public.onde_abonnes%ROWTYPE;
BEGIN
  IF _source IS NULL OR _source NOT IN ('onde', 'evenement') THEN
    RAISE EXCEPTION 'Formulaire inconnu.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT coalesce(_consentement, false) THEN
    RAISE EXCEPTION 'Cochez la case pour accepter de recevoir L''Onde du Sud.' USING ERRCODE = 'P0001';
  END IF;
  m := public.pds_email(_email);
  p := public.pds_txt(_prenom, 100, 'Prénom', _source = 'onde');
  t := public.onde_texte_consentement(_source);

  SELECT * INTO r FROM public.onde_abonnes a WHERE lower(a.email) = m FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.onde_abonnes (email, prenom, source, statut, consentement_le, consentement_texte, essais, essais_depuis)
    VALUES (m, p, _source, 'en_attente', now(), t, 1, now());
    RETURN 'ok';
  END IF;

  -- Anti-abus : 5 envois par heure et par adresse
  IF r.essais_depuis > now() - interval '1 hour' THEN
    IF r.essais >= 5 THEN PERFORM public.pds_trop_d_envois(); END IF;
    r.essais := r.essais + 1;
  ELSE
    r.essais := 1;
    r.essais_depuis := now();
  END IF;

  IF r.statut = 'actif' THEN
    UPDATE public.onde_abonnes SET prenom = coalesce(p, prenom), essais = r.essais, essais_depuis = r.essais_depuis, updated_at = now()
    WHERE id = r.id;
  ELSE
    -- En attente ou désinscrit·e : nouvelle demande, à confirmer par le lien envoyé par e-mail
    UPDATE public.onde_abonnes SET prenom = coalesce(p, prenom), statut = 'en_attente', consentement_le = now(), consentement_texte = t,
      desinscrit_le = NULL, essais = r.essais, essais_depuis = r.essais_depuis, updated_at = now()
    WHERE id = r.id;
  END IF;
  RETURN 'ok';
END $$;

-- Confirmation par le lien reçu par e-mail (lot 4). Renvoie : actif, desinscrit ou introuvable.
CREATE OR REPLACE FUNCTION public.onde_confirmer(_jeton uuid)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE s text;
BEGIN
  UPDATE public.onde_abonnes SET statut = 'actif', confirme_le = now(), updated_at = now()
  WHERE jeton = _jeton AND statut = 'en_attente'
  RETURNING statut INTO s;
  IF s IS NOT NULL THEN RETURN s; END IF;
  SELECT a.statut INTO s FROM public.onde_abonnes a WHERE a.jeton = _jeton;
  RETURN coalesce(s, 'introuvable');
END $$;

-- Désinscription en un clic, sans connexion. Renvoie : desinscrit ou introuvable.
CREATE OR REPLACE FUNCTION public.onde_desinscrire(_jeton uuid)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE s text;
BEGIN
  UPDATE public.onde_abonnes SET statut = 'desinscrit', desinscrit_le = coalesce(CASE WHEN statut = 'desinscrit' THEN desinscrit_le END, now()), updated_at = now()
  WHERE jeton = _jeton
  RETURNING statut INTO s;
  RETURN coalesce(s, 'introuvable');
END $$;

-- « Me réinscrire » depuis la page de désinscription : le jeton vient de la boîte mail de la personne,
-- l'abonnement redevient donc actif tout de suite. Renvoie : actif ou introuvable.
CREATE OR REPLACE FUNCTION public.onde_reinscrire(_jeton uuid)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE s text;
BEGIN
  UPDATE public.onde_abonnes SET statut = 'actif', confirme_le = coalesce(confirme_le, now()), desinscrit_le = NULL,
    consentement_le = now(), consentement_texte = public.onde_texte_consentement('reinscription'), updated_at = now()
  WHERE jeton = _jeton
  RETURNING statut INTO s;
  RETURN coalesce(s, 'introuvable');
END $$;

-- Qui recevra le prochain numéro, calculé au moment de l'envoi :
-- adhérent·es à jour (sauf désinscrit·es) + abonné·es actif·ves qui ne sont pas adhérent·es.
CREATE OR REPLACE FUNCTION public.onde_destinataires()
RETURNS TABLE(email text, prenom text, origine text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH candidats AS (
    SELECT lower(a.email) AS e FROM public.adhesions a
    WHERE coalesce(a.email, '') <> ''
      AND NOT EXISTS (SELECT 1 FROM public.adhesion_rattachements r WHERE r.adhesion_id = a.id)
    UNION
    SELECT lower(r.email_membre) FROM public.adhesion_rattachements r
  ),
  membres AS (
    SELECT c.e FROM candidats c WHERE public.membre_a_jour(c.e)
  )
  SELECT m.e,
    coalesce(
      (SELECT nullif(btrim(pc.prenom), '') FROM public.podcasts pc WHERE lower(pc.email) = m.e AND nullif(btrim(pc.prenom), '') IS NOT NULL ORDER BY pc.created_at LIMIT 1),
      nullif(btrim(ab.prenom), ''),
      (SELECT nullif(btrim(a.prenom), '') FROM public.adhesions a WHERE lower(a.email) = m.e AND nullif(btrim(a.prenom), '') IS NOT NULL ORDER BY a.created_at DESC LIMIT 1)
    ),
    'adhesion'
  FROM membres m
  LEFT JOIN public.onde_abonnes ab ON lower(ab.email) = m.e
  WHERE ab.statut IS DISTINCT FROM 'desinscrit'
  UNION ALL
  SELECT lower(ab.email), ab.prenom, 'abonnement'
  FROM public.onde_abonnes ab
  WHERE ab.statut = 'actif' AND NOT EXISTS (SELECT 1 FROM membres m WHERE m.e = lower(ab.email))
$$;

-- Chiffres de la page « Abonnés » (admins seulement).
CREATE OR REPLACE FUNCTION public.onde_abonnes_bilan()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE res jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Réservé aux admins.' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'adherents_office', (SELECT count(*) FROM public.onde_destinataires() d WHERE d.origine = 'adhesion'),
    'destinataires', (SELECT count(*) FROM public.onde_destinataires()),
    'actifs', count(*) FILTER (WHERE a.statut = 'actif'),
    'en_attente', count(*) FILTER (WHERE a.statut = 'en_attente'),
    'desinscrits', count(*) FILTER (WHERE a.statut = 'desinscrit')
  ) INTO res
  FROM public.onde_abonnes a;
  RETURN res;
END $$;

-- Liste des abonné·es (admins seulement). Le jeton n'est jamais renvoyé.
CREATE OR REPLACE FUNCTION public.onde_abonnes_liste()
RETURNS TABLE(id uuid, email text, prenom text, source text, statut text, consentement_le timestamptz, consentement_texte text,
  confirme_le timestamptz, desinscrit_le timestamptz, created_at timestamptz, adherent boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Réservé aux admins.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT a.id, a.email, a.prenom, a.source, a.statut, a.consentement_le, a.consentement_texte,
      a.confirme_le, a.desinscrit_le, a.created_at, public.membre_a_jour(a.email)
    FROM public.onde_abonnes a
    ORDER BY a.created_at DESC;
END $$;

-- Effacement sur demande (admins seulement).
CREATE OR REPLACE FUNCTION public.onde_supprimer_abonne(_id uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Réservé aux admins.' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.onde_abonnes WHERE id = _id;
  RETURN FOUND;
END $$;

REVOKE ALL ON FUNCTION public.onde_texte_consentement(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.onde_inscrire(text, text, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.onde_confirmer(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.onde_desinscrire(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.onde_reinscrire(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.onde_destinataires() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.onde_abonnes_bilan() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.onde_abonnes_liste() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.onde_supprimer_abonne(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onde_inscrire(text, text, boolean, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onde_confirmer(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onde_desinscrire(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onde_reinscrire(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onde_destinataires() TO service_role;
GRANT EXECUTE ON FUNCTION public.onde_abonnes_bilan() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onde_abonnes_liste() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onde_supprimer_abonne(uuid) TO authenticated, service_role;

-- Effacement des données d'un·e membre : son abonnement à L'Onde part aussi.
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
  DELETE FROM public.adhesion_rattachements WHERE email_membre = m;
  DELETE FROM public.podcasts WHERE id = ANY(ids);
  UPDATE public.adhesions SET email = NULL, prenom = NULL, nom = NULL, telephone = NULL,
    raw_payload = jsonb_build_object('anonymise_le', now())
    WHERE lower(email) = m;
  RETURN images;
END $function$;