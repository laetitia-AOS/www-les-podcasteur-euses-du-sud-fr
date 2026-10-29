-- 1. Formule et échéance des adhésions
ALTER TABLE public.adhesions ADD COLUMN IF NOT EXISTS formule text;
ALTER TABLE public.adhesions ADD COLUMN IF NOT EXISTS date_echeance timestamptz;

UPDATE public.adhesions
SET formule = CASE WHEN type_adhesion ~* '(morale|studio|agence)' THEN 'studio' ELSE 'personne' END
WHERE formule IS NULL;

UPDATE public.adhesions
SET date_echeance = date_adhesion + interval '1 year'
WHERE statut = 'active' AND date_adhesion IS NOT NULL AND date_echeance IS NULL;

ALTER TABLE public.adhesions ADD CONSTRAINT adhesions_formule_check CHECK (formule IS NULL OR formule IN ('personne', 'studio'));

CREATE OR REPLACE FUNCTION public.adhesion_echeance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE base timestamptz; en_cours timestamptz;
BEGIN
  IF NEW.formule IS NULL OR NEW.formule NOT IN ('personne', 'studio') THEN
    NEW.formule := CASE WHEN coalesce(NEW.type_adhesion, '') ~* '(morale|studio|agence)' THEN 'studio' ELSE 'personne' END;
  END IF;
  IF NEW.statut IS DISTINCT FROM 'active' THEN RETURN NEW; END IF;
  -- Échéance saisie à la main par un·e admin : on la garde
  IF TG_OP = 'UPDATE' AND OLD.statut = 'active' AND NEW.date_echeance IS DISTINCT FROM OLD.date_echeance AND NEW.date_echeance IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM 'active' OR NEW.date_echeance IS NULL THEN
    -- Paiement validé plus tard par un·e admin : l'année part du jour de la validation
    base := CASE WHEN TG_OP = 'UPDATE' AND OLD.statut = 'a_verifier' THEN now() ELSE coalesce(NEW.date_adhesion, now()) END;
    SELECT max(a.date_echeance) INTO en_cours FROM public.adhesions a
      WHERE a.id <> NEW.id AND a.statut = 'active' AND NEW.email IS NOT NULL
        AND lower(a.email) = lower(NEW.email) AND a.date_echeance > base AND a.date_adhesion <= base;
    NEW.date_echeance := greatest(base, coalesce(en_cours, base)) + interval '1 year';
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_00_adhesion_echeance ON public.adhesions;
CREATE TRIGGER trg_00_adhesion_echeance
  BEFORE INSERT OR UPDATE ON public.adhesions
  FOR EACH ROW EXECUTE FUNCTION public.adhesion_echeance();

-- 2. Membre à jour = adhésion active dont l'échéance n'est pas passée (règle 2026 conservée)
CREATE OR REPLACE FUNCTION public.membre_a_jour(_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT coalesce(_email, '') <> '' AND EXISTS (
    SELECT 1 FROM public.adhesions a
    WHERE a.statut = 'active'
      AND a.date_adhesion >= timestamptz '2026-01-01 00:00:00 Europe/Paris'
      AND a.date_echeance > now()
      AND (lower(a.email) = lower(_email)
           OR a.id IN (SELECT r.adhesion_id FROM public.adhesion_rattachements r WHERE r.email_membre = lower(_email)))
  )
$function$;

-- 3. Fiche visible publiquement = validée + membre à jour
CREATE OR REPLACE FUNCTION public.podcast_visible(_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.podcasts p WHERE p.id = _id AND p.valide AND public.membre_a_jour(p.email))
$function$;
REVOKE ALL ON FUNCTION public.podcast_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.podcast_visible(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Validated podcasts are publicly visible" ON public.podcasts;
CREATE POLICY "Fiches visibles des membres a jour" ON public.podcasts
  FOR SELECT TO anon, authenticated
  USING (valide AND public.podcast_visible(id));

CREATE OR REPLACE FUNCTION public.episodes_visibles(_podcast_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.podcast_visible(_podcast_id)
$function$;

CREATE OR REPLACE FUNCTION public.lieu_visible(_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.podcast_visible(_id) AND EXISTS (SELECT 1 FROM public.podcasts p WHERE p.id = _id AND p.type_profil IN ('studio','structure_eco'))
$function$;

-- 4. Adhésion du membre connecté (échéance, formule, état)
DROP FUNCTION IF EXISTS public.mon_adhesion();
CREATE FUNCTION public.mon_adhesion()
 RETURNS TABLE(date_adhesion timestamptz, type_adhesion text, statut text, montant numeric, date_echeance timestamptz, formule text, etat text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT a.date_adhesion, a.type_adhesion, a.statut, a.montant, a.date_echeance, a.formule,
    CASE
      WHEN a.statut = 'active' AND a.date_adhesion >= timestamptz '2026-01-01 00:00:00 Europe/Paris' AND a.date_echeance > now() + interval '30 days' THEN 'a_jour'
      WHEN a.statut = 'active' AND a.date_adhesion >= timestamptz '2026-01-01 00:00:00 Europe/Paris' AND a.date_echeance > now() THEN 'bientot'
      WHEN a.statut = 'a_verifier' THEN 'verification'
      ELSE 'terminee'
    END
  FROM public.adhesions a
  WHERE coalesce(auth.jwt() ->> 'email', '') <> ''
    AND a.statut IN ('active', 'a_verifier', 'expired')
    AND (
      lower(a.email) = lower(auth.jwt() ->> 'email')
      OR a.id IN (SELECT r.adhesion_id FROM public.adhesion_rattachements r WHERE r.email_membre = lower(auth.jwt() ->> 'email'))
    )
  ORDER BY (a.statut = 'active' AND a.date_echeance > now()) DESC, (a.statut = 'a_verifier') DESC,
    a.date_echeance DESC NULLS LAST, a.date_adhesion DESC NULLS LAST
  LIMIT 1
$function$;
REVOKE ALL ON FUNCTION public.mon_adhesion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_adhesion() TO authenticated, service_role;

-- 5. Rappels d'échéance (admin seulement)
CREATE TABLE IF NOT EXISTS public.rappels_adhesion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adhesion_id uuid NOT NULL REFERENCES public.adhesions(id) ON DELETE CASCADE,
  palier integer NOT NULL CHECK (palier IN (30, 7)),
  envoye_le timestamptz NOT NULL DEFAULT now(),
  envoye_par uuid,
  UNIQUE (adhesion_id, palier)
);
GRANT SELECT, INSERT ON public.rappels_adhesion TO authenticated;
GRANT ALL ON public.rappels_adhesion TO service_role;
ALTER TABLE public.rappels_adhesion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins lisent les rappels" ON public.rappels_adhesion FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins notent les rappels" ON public.rappels_adhesion FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Chiffres des fiches (aucun accès direct depuis le site)
CREATE TABLE IF NOT EXISTS public.stats_fiches_jour (
  podcast_id uuid NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  jour date NOT NULL,
  vues integer NOT NULL DEFAULT 0,
  ecoutes integer NOT NULL DEFAULT 0,
  PRIMARY KEY (podcast_id, jour)
);
GRANT ALL ON public.stats_fiches_jour TO service_role;
ALTER TABLE public.stats_fiches_jour ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.stats_empreintes (
  empreinte text NOT NULL,
  podcast_id uuid NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('vue', 'ecoute')),
  jour date NOT NULL,
  PRIMARY KEY (empreinte, podcast_id, type, jour)
);
CREATE INDEX IF NOT EXISTS stats_empreintes_jour_idx ON public.stats_empreintes (jour);
GRANT ALL ON public.stats_empreintes TO service_role;
ALTER TABLE public.stats_empreintes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.compter_stat(_podcast_id uuid, _type text, _empreinte text, _email_visiteur text DEFAULT NULL)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE j date := (now() AT TIME ZONE 'Europe/Paris')::date; n int;
BEGIN
  IF _type NOT IN ('vue', 'ecoute') OR coalesce(length(_empreinte), 0) < 32 OR NOT public.podcast_visible(_podcast_id) THEN RETURN false; END IF;
  -- Le membre qui regarde sa propre fiche n'est pas compté
  IF _email_visiteur IS NOT NULL AND EXISTS (SELECT 1 FROM public.podcasts p WHERE p.id = _podcast_id AND lower(p.email) = lower(_email_visiteur)) THEN RETURN false; END IF;
  DELETE FROM public.stats_empreintes WHERE jour < j - 1;
  -- Une même empreinte compte au plus 300 actions par jour, toutes fiches confondues
  IF (SELECT count(*) FROM public.stats_empreintes e WHERE e.empreinte = _empreinte AND e.jour = j) >= 300 THEN RETURN false; END IF;
  INSERT INTO public.stats_empreintes (empreinte, podcast_id, type, jour) VALUES (_empreinte, _podcast_id, _type, j) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN RETURN false; END IF;
  INSERT INTO public.stats_fiches_jour (podcast_id, jour, vues, ecoutes)
    VALUES (_podcast_id, j, CASE WHEN _type = 'vue' THEN 1 ELSE 0 END, CASE WHEN _type = 'ecoute' THEN 1 ELSE 0 END)
  ON CONFLICT (podcast_id, jour) DO UPDATE SET
    vues = public.stats_fiches_jour.vues + EXCLUDED.vues,
    ecoutes = public.stats_fiches_jour.ecoutes + EXCLUDED.ecoutes;
  RETURN true;
END $function$;
REVOKE ALL ON FUNCTION public.compter_stat(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compter_stat(uuid, text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.mes_stats()
 RETURNS TABLE(mois date, vues integer, ecoutes integer, demandes integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH debut AS (SELECT date_trunc('month', now() AT TIME ZONE 'Europe/Paris')::date AS d),
  mes AS (
    SELECT p.id FROM public.podcasts p
    WHERE coalesce(auth.jwt() ->> 'email', '') <> '' AND lower(p.email) = lower(auth.jwt() ->> 'email')
  )
  SELECT (SELECT d FROM debut),
    coalesce((SELECT sum(s.vues) FROM public.stats_fiches_jour s WHERE s.podcast_id IN (SELECT id FROM mes) AND s.jour >= (SELECT d FROM debut)), 0)::int,
    coalesce((SELECT sum(s.ecoutes) FROM public.stats_fiches_jour s WHERE s.podcast_id IN (SELECT id FROM mes) AND s.jour >= (SELECT d FROM debut)), 0)::int,
    (SELECT count(*) FROM public.contact_requests c WHERE c.recipient_id IN (SELECT id FROM mes)
      AND c.created_at >= ((SELECT d FROM debut)::timestamp AT TIME ZONE 'Europe/Paris'))::int
$function$;
REVOKE ALL ON FUNCTION public.mes_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mes_stats() TO authenticated, service_role;

-- 7. Liste des membres pour l'administration (vide pour qui n'est pas admin)
CREATE OR REPLACE FUNCTION public.admin_membres()
 RETURNS TABLE(email text, nom text, type_profil text, formule text, etat text, date_echeance timestamptz, montant numeric,
   date_paiement timestamptz, adhesion_id uuid, nb_fiches integer, fiche_validee boolean, fiche_visible boolean,
   rappel_30 timestamptz, rappel_7 timestamptz)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH pay AS (
    SELECT lower(a.email) AS e, a.id, a.statut, a.formule, a.montant, a.date_adhesion, a.date_echeance, a.prenom, a.nom
    FROM public.adhesions a WHERE a.email IS NOT NULL
    UNION ALL
    SELECT r.email_membre, a.id, a.statut, a.formule, a.montant, a.date_adhesion, a.date_echeance, a.prenom, a.nom
    FROM public.adhesion_rattachements r JOIN public.adhesions a ON a.id = r.adhesion_id
  ),
  dern AS (
    SELECT DISTINCT ON (pay.e) pay.* FROM pay
    ORDER BY pay.e, (pay.statut = 'active' AND pay.date_echeance > now()) DESC, (pay.statut = 'a_verifier') DESC,
      pay.date_echeance DESC NULLS LAST, pay.date_adhesion DESC NULLS LAST
  ),
  fic AS (
    SELECT lower(p.email) AS e, count(*)::int AS n, bool_or(p.valide) AS validee,
      (array_agg(p.type_profil ORDER BY (p.type_profil = 'podcasteur'), p.created_at))[1] AS tp,
      (array_agg(nullif(trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')), '') ORDER BY p.created_at) FILTER (WHERE coalesce(p.prenom, p.nom) IS NOT NULL))[1] AS nm,
      (array_agg(p.nom_podcast ORDER BY p.created_at))[1] AS np
    FROM public.podcasts p GROUP BY lower(p.email)
  ),
  gens AS (SELECT e FROM dern UNION SELECT e FROM fic)
  SELECT g.e,
    coalesce(f.nm, nullif(trim(coalesce(d.prenom, '') || ' ' || coalesce(d.nom, '')), ''), f.np, g.e),
    f.tp,
    coalesce(d.formule, CASE WHEN f.tp = 'studio' THEN 'studio' ELSE 'personne' END),
    CASE
      WHEN d.e IS NULL THEN 'sans_adhesion'
      WHEN d.statut = 'active' AND d.date_adhesion >= timestamptz '2026-01-01 00:00:00 Europe/Paris' AND d.date_echeance > now() + interval '30 days' THEN 'a_jour'
      WHEN d.statut = 'active' AND d.date_adhesion >= timestamptz '2026-01-01 00:00:00 Europe/Paris' AND d.date_echeance > now() THEN 'bientot'
      WHEN d.statut = 'a_verifier' THEN 'verification'
      ELSE 'terminee'
    END,
    d.date_echeance, d.montant, d.date_adhesion, d.id,
    coalesce(f.n, 0), coalesce(f.validee, false),
    coalesce(f.validee, false) AND public.membre_a_jour(g.e),
    (SELECT r.envoye_le FROM public.rappels_adhesion r WHERE r.adhesion_id = d.id AND r.palier = 30),
    (SELECT r.envoye_le FROM public.rappels_adhesion r WHERE r.adhesion_id = d.id AND r.palier = 7)
  FROM gens g LEFT JOIN dern d ON d.e = g.e LEFT JOIN fic f ON f.e = g.e
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY 2
$function$;
REVOKE ALL ON FUNCTION public.admin_membres() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_membres() TO authenticated, service_role;

-- 8. Effacement des données d'un membre (appelé uniquement par le serveur, après vérification du compte)
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

  -- Images publiques à retirer du stockage (fiches, galeries)
  SELECT coalesce(array_agg(DISTINCT u), '{}') INTO images FROM (
    SELECT unnest(ARRAY[p.vignette_url, p.photo_profil_url]) AS u FROM public.podcasts p WHERE p.id = ANY(ids)
    UNION ALL SELECT unnest(fl.photos) FROM public.fiches_lieux fl WHERE fl.podcast_id = ANY(ids)
    UNION ALL SELECT e.image_url FROM public.evenements e JOIN public.evenements_proposeurs ep ON ep.evenement_id = e.id
      WHERE lower(ep.email) = m AND e.statut <> 'publie'
  ) x WHERE u IS NOT NULL AND u <> '';

  -- Propositions d'événement : retirées si non publiées, anonymisées si publiées
  DELETE FROM public.evenements e USING public.evenements_proposeurs ep
    WHERE ep.evenement_id = e.id AND lower(ep.email) = m AND e.statut <> 'publie';
  UPDATE public.evenements e SET propose_par = NULL, propose_par_nom = NULL
    FROM public.evenements_proposeurs ep WHERE ep.evenement_id = e.id AND lower(ep.email) = m;
  DELETE FROM public.evenements_proposeurs WHERE lower(email) = m;

  DELETE FROM public.evenement_inscriptions WHERE lower(email) = m;
  -- Messages envoyés à d'autres membres : gardés chez le destinataire, signés « Membre supprimé »
  UPDATE public.contact_requests SET sender_name = 'Membre supprimé', sender_email = 'membre-supprime@invalid'
    WHERE lower(sender_email) = m;
  UPDATE public.demandes_devis SET nom = 'Membre supprimé', email = 'membre-supprime@invalid' WHERE lower(email) = m;
  DELETE FROM public.contacts WHERE lower(email) = m;
  DELETE FROM public.images_en_attente WHERE lower(email) = m;
  DELETE FROM public.adhesion_rattachements WHERE email_membre = m;
  -- Fiches : messages reçus, épisodes, détails studio, chiffres partent avec elles
  DELETE FROM public.podcasts WHERE id = ANY(ids);
  -- Paiements : justificatifs comptables gardés sans identité
  UPDATE public.adhesions SET email = NULL, prenom = NULL, nom = NULL, telephone = NULL,
    raw_payload = jsonb_build_object('anonymise_le', now())
    WHERE lower(email) = m;
  RETURN images;
END $function$;
REVOKE ALL ON FUNCTION public.effacer_donnees_membre(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.effacer_donnees_membre(text) TO service_role;