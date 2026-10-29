-- Fiches déjà validées dont l'adhésion n'est pas encore réglée : restent visibles le temps de la relance,
-- jusqu'à ce qu'un·e admin retire ce sursis. Rien n'est jamais effacé.
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS visible_sans_adhesion boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.podcasts.visible_sans_adhesion IS 'Sursis décidé par l''équipe : fiche validée visible même sans adhésion à jour (relance en cours). Modifiable par les admins seulement.';

UPDATE public.podcasts p SET visible_sans_adhesion = true
WHERE p.valide AND NOT public.membre_a_jour(p.email);

CREATE OR REPLACE FUNCTION public.podcast_visible(_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.podcasts p WHERE p.id = _id AND p.valide
    AND (p.visible_sans_adhesion OR public.membre_a_jour(p.email)))
$function$;

-- Le membre ne peut pas s'accorder ce sursis (ni à l'inscription, ni en modifiant sa fiche)
CREATE OR REPLACE FUNCTION public.guard_podcasts_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  NEW.valide := OLD.valide;
  NEW.email := OLD.email;
  NEW.created_at := OLD.created_at;
  NEW.visible_sans_adhesion := OLD.visible_sans_adhesion;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.guard_podcasts_sursis_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN NEW.visible_sans_adhesion := false; END IF;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS trg_00c_guard_podcasts_sursis ON public.podcasts;
CREATE TRIGGER trg_00c_guard_podcasts_sursis BEFORE INSERT ON public.podcasts
  FOR EACH ROW EXECUTE FUNCTION public.guard_podcasts_sursis_insert();

-- Admin : accorder ou retirer le sursis pour toutes les fiches d'une adresse
CREATE OR REPLACE FUNCTION public.sursis_adhesion(_email text, _actif boolean)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE n int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Réservé aux administrateur·ices.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.podcasts SET visible_sans_adhesion = coalesce(_actif, false) WHERE lower(email) = lower(_email);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $function$;
REVOKE ALL ON FUNCTION public.sursis_adhesion(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sursis_adhesion(text, boolean) TO authenticated, service_role;

-- Liste admin : indique le sursis
DROP FUNCTION IF EXISTS public.admin_membres();
CREATE FUNCTION public.admin_membres()
 RETURNS TABLE(email text, nom text, type_profil text, formule text, etat text, annee integer, montant numeric,
   date_paiement timestamptz, adhesion_id uuid, nb_fiches integer, fiche_validee boolean, fiche_visible boolean, sursis boolean)
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
      bool_or(p.valide AND p.visible_sans_adhesion) AS sursis,
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
    coalesce(f.validee, false) AND (coalesce(f.sursis, false) OR public.membre_a_jour(g.e)),
    coalesce(f.sursis, false) AND NOT public.membre_a_jour(g.e)
  FROM gens g LEFT JOIN dern d ON d.e = g.e LEFT JOIN fic f ON f.e = g.e LEFT JOIN verif v ON v.e = g.e
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY 2
$function$;
REVOKE ALL ON FUNCTION public.admin_membres() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_membres() TO authenticated, service_role;