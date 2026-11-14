CREATE OR REPLACE FUNCTION public.onde_membres_calcul(_mois date, _numero_id uuid)
 RETURNS TABLE(email text, du_mois boolean, complet boolean, deja boolean, podcast_id uuid, nom text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
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
      -- Période du 25 au 24 (heure de Paris) : un paiement à partir du 25 compte pour le mois suivant.
      (date_trunc('month', p.d AT TIME ZONE 'Europe/Paris')
        + CASE WHEN extract(day FROM p.d AT TIME ZONE 'Europe/Paris') >= 25 THEN interval '1 month' ELSE interval '0' END)::date AS mois
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
  montres AS (
    SELECT DISTINCT lower(pc.email) AS e, p.mois
    FROM publies p
    CROSS JOIN LATERAL jsonb_array_elements_text(CASE WHEN jsonb_typeof(p.bloc->'membres') = 'array' THEN p.bloc->'membres' ELSE '[]'::jsonb END) mid(v)
    JOIN public.podcasts pc ON pc.id::text = mid.v
  ),
  -- Fiche publique rattachée à l'adhésion : de préférence une fiche avec un vrai podcast, sinon une fiche de l'annuaire, sinon un studio ou une structure.
  fiche AS (
    SELECT lower(pc.email) AS e,
      (array_agg(pc.id ORDER BY
          CASE WHEN pc.type_profil = 'podcasteur' AND coalesce(pc.nom_podcast, '') !~ '^[—–.[:space:]-]*$' THEN 0
               WHEN pc.type_profil IN ('podcasteur', 'pro_podcast', 'soutien') THEN 1 ELSE 2 END,
          pc.created_at)
        FILTER (WHERE public.podcast_visible(pc.id)))[1] AS pod,
      (array_agg(nullif(btrim(concat_ws(' ', pc.prenom, pc.nom)), '') ORDER BY pc.created_at)
        FILTER (WHERE nullif(btrim(concat_ws(' ', pc.prenom, pc.nom)), '') IS NOT NULL))[1] AS nom
    FROM public.podcasts pc GROUP BY lower(pc.email)
  )
  SELECT g.e,
    true,
    f.pod IS NOT NULL,
    EXISTS (SELECT 1 FROM montres mo WHERE mo.e = g.e AND coalesce(mo.mois, g.arrivee) >= g.arrivee),
    f.pod,
    coalesce(f.nom, g.nom_paiement, 'Sans nom')
  FROM gens g
  LEFT JOIN fiche f ON f.e = g.e
  WHERE g.arrivee = date_trunc('month', _mois)::date
$function$;

REVOKE EXECUTE ON FUNCTION public.onde_membres_calcul(date, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.onde_nouveaux_membres_bilan(_numero_id uuid, _bloc_id text, _mois date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Nombres et noms des personnes citées seulement : jamais le nom d'une adhésion sans fiche.
  SELECT jsonb_build_object(
    'debut', (m - interval '1 month' + interval '24 days')::date,
    'fin', (m + interval '23 days')::date,
    'nouveaux', count(*),
    'fige', fige IS NOT NULL,
    'affiches', CASE WHEN fige IS NOT NULL
      THEN coalesce((SELECT jsonb_agg(nullif(btrim(concat_ws(' ', k.prenom, k.nom)), '')) FROM public.onde_cartes_membres(fige) k), '[]'::jsonb)
      ELSE coalesce(jsonb_agg(c.nom ORDER BY lower(c.nom)) FILTER (WHERE c.complet AND NOT c.deja), '[]'::jsonb) END,
    'deja', count(*) FILTER (WHERE c.deja),
    'sans_fiche', count(*) FILTER (WHERE NOT c.deja AND NOT c.complet AND NOT (c.email = ANY(fige_mails)))
  ) INTO res
  FROM public.onde_membres_calcul(m, _numero_id) c;
  RETURN res;
END $function$;

REVOKE EXECUTE ON FUNCTION public.onde_nouveaux_membres_bilan(uuid, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onde_nouveaux_membres_bilan(uuid, text, date) TO authenticated, service_role;