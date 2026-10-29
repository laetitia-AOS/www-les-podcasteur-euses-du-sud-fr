-- Adhésion à l'année civile : valable jusqu'au 31 décembre de l'année couverte,
-- profil encore visible en janvier (tolérance), masqué le 1er février.
ALTER TABLE public.adhesions ADD COLUMN IF NOT EXISTS annee integer;

UPDATE public.adhesions
SET annee = extract(year FROM (date_adhesion AT TIME ZONE 'Europe/Paris'))::int,
    date_echeance = make_timestamptz(extract(year FROM (date_adhesion AT TIME ZONE 'Europe/Paris'))::int + 1, 1, 1, 0, 0, 0, 'Europe/Paris')
WHERE statut = 'active' AND date_adhesion IS NOT NULL;

COMMENT ON COLUMN public.adhesions.annee IS 'Année civile couverte par ce paiement (valable jusqu''au 31 décembre).';
COMMENT ON COLUMN public.adhesions.date_echeance IS 'Fin de validité : 1er janvier suivant l''année couverte (calculée depuis annee).';
COMMENT ON TABLE public.rappels_adhesion IS 'DEPRECATED: rappels individuels abandonnés (renouvellement collectif à l''année civile).';

-- Année couverte : celle du paiement ; si le membre a déjà payé cette année (ou plus loin), l'année suivante.
CREATE OR REPLACE FUNCTION public.adhesion_echeance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE base_annee int; deja int;
BEGIN
  IF NEW.formule IS NULL OR NEW.formule NOT IN ('personne', 'studio') THEN
    NEW.formule := CASE WHEN coalesce(NEW.type_adhesion, '') ~* '(morale|studio|agence)' THEN 'studio' ELSE 'personne' END;
  END IF;
  IF NEW.statut IS DISTINCT FROM 'active' THEN RETURN NEW; END IF;
  -- Année saisie à la main par un·e admin : on la garde
  IF TG_OP = 'UPDATE' AND OLD.statut = 'active' AND NEW.annee IS DISTINCT FROM OLD.annee AND NEW.annee IS NOT NULL THEN
    NEW.date_echeance := make_timestamptz(NEW.annee + 1, 1, 1, 0, 0, 0, 'Europe/Paris');
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM 'active' OR NEW.annee IS NULL THEN
    -- Paiement validé plus tard par un·e admin : l'année est celle du paiement, pas de la validation
    base_annee := extract(year FROM (coalesce(NEW.date_adhesion, now()) AT TIME ZONE 'Europe/Paris'))::int;
    SELECT max(a.annee) INTO deja FROM public.adhesions a
      WHERE a.id <> NEW.id AND a.statut = 'active' AND NEW.email IS NOT NULL
        AND lower(a.email) = lower(NEW.email) AND a.annee >= base_annee;
    NEW.annee := CASE WHEN deja IS NULL THEN base_annee ELSE deja + 1 END;
  END IF;
  NEW.date_echeance := make_timestamptz(NEW.annee + 1, 1, 1, 0, 0, 0, 'Europe/Paris');
  RETURN NEW;
END $function$;

-- Membre à jour : année en cours payée, ou année précédente pendant le mois de janvier (tolérance)
CREATE OR REPLACE FUNCTION public.annee_couverte(_email text)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT max(a.annee) FROM public.adhesions a
  WHERE coalesce(_email, '') <> '' AND a.statut = 'active' AND a.annee >= 2026
    AND (lower(a.email) = lower(_email)
         OR a.id IN (SELECT r.adhesion_id FROM public.adhesion_rattachements r WHERE r.email_membre = lower(_email)))
$function$;
REVOKE ALL ON FUNCTION public.annee_couverte(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.annee_couverte(text) TO service_role;

CREATE OR REPLACE FUNCTION public.membre_a_jour(_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH t AS (SELECT (now() AT TIME ZONE 'Europe/Paris') AS n),
  c AS (SELECT public.annee_couverte(_email) AS a)
  SELECT coalesce((SELECT a FROM c) >= extract(year FROM (SELECT n FROM t))::int
    OR (extract(month FROM (SELECT n FROM t)) = 1 AND (SELECT a FROM c) = extract(year FROM (SELECT n FROM t))::int - 1), false)
$function$;

-- Adhésion du membre connecté
DROP FUNCTION IF EXISTS public.mon_adhesion();
CREATE FUNCTION public.mon_adhesion()
 RETURNS TABLE(date_adhesion timestamptz, type_adhesion text, statut text, montant numeric, formule text, annee integer, etat text, annee_renouvellement integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH moi AS (SELECT lower(coalesce(auth.jwt() ->> 'email', '')) AS e),
  t AS (SELECT extract(year FROM (now() AT TIME ZONE 'Europe/Paris'))::int AS y, extract(month FROM (now() AT TIME ZONE 'Europe/Paris'))::int AS m),
  mes AS (
    SELECT a.* FROM public.adhesions a, moi
    WHERE moi.e <> '' AND a.statut IN ('active', 'a_verifier', 'expired')
      AND (lower(a.email) = moi.e OR a.id IN (SELECT r.adhesion_id FROM public.adhesion_rattachements r WHERE r.email_membre = moi.e))
  ),
  couv AS (SELECT max(annee) AS a FROM mes WHERE statut = 'active' AND annee >= 2026),
  dern AS (
    SELECT * FROM mes
    ORDER BY (statut = 'active') DESC, annee DESC NULLS LAST, (statut = 'a_verifier') DESC, date_adhesion DESC NULLS LAST
    LIMIT 1
  )
  SELECT d.date_adhesion, d.type_adhesion, d.statut, d.montant, d.formule, (SELECT a FROM couv),
    CASE
      WHEN (SELECT a FROM couv) >= (SELECT y FROM t) THEN 'a_jour'
      WHEN EXISTS (SELECT 1 FROM mes WHERE statut = 'a_verifier') THEN 'verification'
      WHEN (SELECT m FROM t) = 1 AND (SELECT a FROM couv) = (SELECT y FROM t) - 1 THEN 'tolerance'
      ELSE 'terminee'
    END,
    -- Année que couvrirait un paiement fait aujourd'hui
    CASE WHEN (SELECT a FROM couv) >= (SELECT y FROM t) THEN (SELECT a FROM couv) + 1 ELSE (SELECT y FROM t) END
  FROM dern d
$function$;
REVOKE ALL ON FUNCTION public.mon_adhesion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_adhesion() TO authenticated, service_role;

-- Liste des membres (admin)
DROP FUNCTION IF EXISTS public.admin_membres();
CREATE FUNCTION public.admin_membres()
 RETURNS TABLE(email text, nom text, type_profil text, formule text, etat text, annee integer, montant numeric,
   date_paiement timestamptz, adhesion_id uuid, nb_fiches integer, fiche_validee boolean, fiche_visible boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH t AS (SELECT extract(year FROM (now() AT TIME ZONE 'Europe/Paris'))::int AS y, extract(month FROM (now() AT TIME ZONE 'Europe/Paris'))::int AS m),
  pay AS (
    SELECT lower(a.email) AS e, a.id, a.statut, a.formule, a.montant, a.date_adhesion, a.annee, a.prenom, a.nom
    FROM public.adhesions a WHERE a.email IS NOT NULL
    UNION ALL
    SELECT r.email_membre, a.id, a.statut, a.formule, a.montant, a.date_adhesion, a.annee, a.prenom, a.nom
    FROM public.adhesion_rattachements r JOIN public.adhesions a ON a.id = r.adhesion_id
  ),
  dern AS (
    SELECT DISTINCT ON (pay.e) pay.* FROM pay
    ORDER BY pay.e, (pay.statut = 'active') DESC, pay.annee DESC NULLS LAST, (pay.statut = 'a_verifier') DESC, pay.date_adhesion DESC NULLS LAST
  ),
  verif AS (SELECT DISTINCT e FROM pay WHERE statut = 'a_verifier'),
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
      WHEN d.statut = 'active' AND d.annee >= (SELECT y FROM t) THEN 'a_jour'
      WHEN v.e IS NOT NULL THEN 'verification'
      WHEN d.statut = 'active' AND (SELECT m FROM t) = 1 AND d.annee = (SELECT y FROM t) - 1 THEN 'tolerance'
      ELSE 'terminee'
    END,
    CASE WHEN d.statut = 'active' THEN d.annee END, d.montant, d.date_adhesion, d.id,
    coalesce(f.n, 0), coalesce(f.validee, false),
    coalesce(f.validee, false) AND public.membre_a_jour(g.e)
  FROM gens g LEFT JOIN dern d ON d.e = g.e LEFT JOIN fic f ON f.e = g.e LEFT JOIN verif v ON v.e = g.e
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY 2
$function$;
REVOKE ALL ON FUNCTION public.admin_membres() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_membres() TO authenticated, service_role;