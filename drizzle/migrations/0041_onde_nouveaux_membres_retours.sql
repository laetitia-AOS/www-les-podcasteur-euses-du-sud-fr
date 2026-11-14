-- « Les nouveaux membres du mois » : compte la toute première adhésion et le retour après au moins une année civile
-- sans adhésion ; le renouvellement d'une adhésion de l'année précédente n'est pas compté.
-- Une personne déjà présentée ne l'est plus pour la même arrivée ; elle peut l'être de nouveau si elle revient plus tard.
CREATE OR REPLACE FUNCTION public.onde_membres_calcul(_mois date, _numero_id uuid)
RETURNS TABLE(email text, du_mois boolean, complet boolean, deja boolean, podcast_id uuid, nom text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH pay AS (
    SELECT lower(a.email) AS e, coalesce(a.date_adhesion, a.created_at) AS d, a.statut, a.annee, a.prenom, a.nom
    FROM public.adhesions a
    WHERE coalesce(a.email, '') <> '' AND a.statut IN ('active', 'expired')
      AND NOT EXISTS (SELECT 1 FROM public.adhesion_rattachements r WHERE r.adhesion_id = a.id)
    UNION ALL
    SELECT lower(r.email_membre), coalesce(a.date_adhesion, a.created_at), a.statut, a.annee, a.prenom, a.nom
    FROM public.adhesion_rattachements r JOIN public.adhesions a ON a.id = r.adhesion_id
    WHERE a.statut IN ('active', 'expired')
  ),
  annees AS (
    SELECT p.e, p.d, p.statut, p.prenom, p.nom,
      coalesce(p.annee, extract(year FROM p.d AT TIME ZONE 'Europe/Paris')::int) AS an,
      date_trunc('month', p.d AT TIME ZONE 'Europe/Paris')::date AS mois
    FROM pay p
  ),
  -- Arrivée : premier paiement d'une année civile dont l'année précédente n'est pas couverte.
  arrivees AS (
    SELECT DISTINCT ON (y.e, y.an) y.e, y.an, y.mois
    FROM annees y
    WHERE NOT EXISTS (SELECT 1 FROM annees z WHERE z.e = y.e AND z.an = y.an - 1)
    ORDER BY y.e, y.an, y.d
  ),
  derniere AS (
    SELECT DISTINCT ON (a.e) a.e, a.an, a.mois
    FROM arrivees a
    WHERE a.mois <= date_trunc('month', _mois)::date
    ORDER BY a.e, a.an DESC
  ),
  gens AS (
    SELECT dn.e, dn.mois AS arrivee,
      (SELECT (array_agg(nullif(btrim(concat_ws(' ', y.prenom, y.nom)), '') ORDER BY y.d)
         FILTER (WHERE nullif(btrim(concat_ws(' ', y.prenom, y.nom)), '') IS NOT NULL))[1]
       FROM annees y WHERE y.e = dn.e) AS nom_paiement
    FROM derniere dn
    WHERE EXISTS (SELECT 1 FROM annees y WHERE y.e = dn.e AND y.statut = 'active' AND y.an >= dn.an)
  ),
  publies AS (
    SELECT bl.value AS bloc, nullif(bl.value->>'mois', '')::date AS mois
    FROM public.onde_numeros o CROSS JOIN LATERAL jsonb_array_elements(o.blocs) bl
    WHERE o.statut = 'publie' AND o.id IS DISTINCT FROM _numero_id AND bl.value->>'type' = 'nouveaux_membres'
  ),
  mois_vises AS (
    SELECT date_trunc('month', _mois)::date AS m
    UNION
    SELECT p.mois FROM publies p
    WHERE p.mois IS NOT NULL AND p.mois < date_trunc('month', _mois)::date
  ),
  montres AS (
    SELECT DISTINCT lower(pc.email) AS e, p.mois
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
    g.arrivee = date_trunc('month', _mois)::date,
    coalesce(f.photo, false) AND f.pod IS NOT NULL,
    EXISTS (SELECT 1 FROM montres mo WHERE mo.e = g.e AND coalesce(mo.mois, g.arrivee) >= g.arrivee),
    f.pod,
    coalesce(f.nom, g.nom_paiement, 'Sans nom')
  FROM gens g
  LEFT JOIN fiche f ON f.e = g.e
  WHERE g.arrivee IN (SELECT m FROM mois_vises)
$$;

REVOKE EXECUTE ON FUNCTION public.onde_membres_calcul(date, uuid) FROM PUBLIC, anon, authenticated;