-- Comptage anonyme des visites du site (sans cookie) et rapport de la semaine pour l'équipe.
CREATE TABLE IF NOT EXISTS public.stats_site_empreintes (
  empreinte text NOT NULL,
  jour date NOT NULL,
  actions integer NOT NULL DEFAULT 1,
  PRIMARY KEY (empreinte, jour)
);
CREATE TABLE IF NOT EXISTS public.stats_site_jour (
  jour date PRIMARY KEY,
  visiteurs integer NOT NULL DEFAULT 0,
  pages_vues integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.stats_pages_jour (
  jour date NOT NULL,
  page text NOT NULL CHECK (page ~ '^/[a-z0-9/-]{0,120}$'),
  vues integer NOT NULL DEFAULT 0,
  PRIMARY KEY (jour, page)
);
CREATE TABLE IF NOT EXISTS public.stats_provenances_jour (
  jour date NOT NULL,
  provenance text NOT NULL CHECK (provenance IN ('direct','google','bing','autre-moteur','linkedin','facebook','instagram','whatsapp','x','autre-site')),
  visiteurs integer NOT NULL DEFAULT 0,
  PRIMARY KEY (jour, provenance)
);
ALTER TABLE public.stats_site_empreintes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_site_jour ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_pages_jour ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_provenances_jour ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stats_site_empreintes, public.stats_site_jour, public.stats_pages_jour, public.stats_provenances_jour FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.stats_site_empreintes, public.stats_site_jour, public.stats_pages_jour, public.stats_provenances_jour TO service_role;

CREATE OR REPLACE FUNCTION public.compter_visite(_empreinte text, _page text, _provenance text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE j date := (now() AT TIME ZONE 'Europe/Paris')::date; n int; nb int; prov text;
BEGIN
  IF coalesce(length(_empreinte), 0) < 32 OR _page IS NULL OR _page !~ '^/[a-z0-9/-]{0,120}$' THEN RETURN false; END IF;
  prov := CASE WHEN _provenance IN ('direct','google','bing','autre-moteur','linkedin','facebook','instagram','whatsapp','x','autre-site') THEN _provenance ELSE 'direct' END;
  DELETE FROM public.stats_site_empreintes WHERE jour < j - 1;
  INSERT INTO public.stats_site_empreintes (empreinte, jour) VALUES (_empreinte, j) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    -- Au plus 300 pages par jour pour une même empreinte (robots, rechargements en boucle)
    UPDATE public.stats_site_empreintes SET actions = actions + 1 WHERE empreinte = _empreinte AND jour = j RETURNING actions INTO nb;
    IF nb > 300 THEN RETURN false; END IF;
  ELSE
    INSERT INTO public.stats_provenances_jour (jour, provenance, visiteurs) VALUES (j, prov, 1)
      ON CONFLICT (jour, provenance) DO UPDATE SET visiteurs = public.stats_provenances_jour.visiteurs + 1;
  END IF;
  INSERT INTO public.stats_site_jour (jour, visiteurs, pages_vues) VALUES (j, CASE WHEN n = 1 THEN 1 ELSE 0 END, 1)
    ON CONFLICT (jour) DO UPDATE SET
      visiteurs = public.stats_site_jour.visiteurs + EXCLUDED.visiteurs,
      pages_vues = public.stats_site_jour.pages_vues + 1;
  INSERT INTO public.stats_pages_jour (jour, page, vues) VALUES (j, _page, 1)
    ON CONFLICT (jour, page) DO UPDATE SET vues = public.stats_pages_jour.vues + 1;
  RETURN true;
END $function$;
REVOKE ALL ON FUNCTION public.compter_visite(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compter_visite(text, text, text) TO service_role;

-- Chiffres d'une semaine (du lundi _debut au dimanche), avec la semaine d'avant pour comparer.
CREATE OR REPLACE FUNCTION public.rapport_semaine(_debut date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH b AS (
    SELECT _debut AS d, _debut + 7 AS f, _debut - 7 AS pd,
      (_debut::timestamp AT TIME ZONE 'Europe/Paris') AS ts_d,
      ((_debut + 7)::timestamp AT TIME ZONE 'Europe/Paris') AS ts_f,
      ((_debut - 7)::timestamp AT TIME ZONE 'Europe/Paris') AS ts_pd
  )
  SELECT jsonb_build_object(
    'debut', (SELECT d FROM b),
    'fin', (SELECT f - 1 FROM b),
    'comptage_depuis', (SELECT min(jour) FROM public.stats_site_jour),
    'visiteurs', (SELECT coalesce(sum(visiteurs), 0) FROM public.stats_site_jour, b WHERE jour >= b.d AND jour < b.f),
    'visiteurs_avant', (SELECT coalesce(sum(visiteurs), 0) FROM public.stats_site_jour, b WHERE jour >= b.pd AND jour < b.d),
    'pages_vues', (SELECT coalesce(sum(pages_vues), 0) FROM public.stats_site_jour, b WHERE jour >= b.d AND jour < b.f),
    'pages_vues_avant', (SELECT coalesce(sum(pages_vues), 0) FROM public.stats_site_jour, b WHERE jour >= b.pd AND jour < b.d),
    'provenances', coalesce((SELECT jsonb_agg(jsonb_build_object('nom', provenance, 'n', n) ORDER BY n DESC) FROM (
        SELECT provenance, sum(visiteurs)::int AS n FROM public.stats_provenances_jour, b WHERE jour >= b.d AND jour < b.f GROUP BY provenance) x), '[]'::jsonb),
    'pages', coalesce((SELECT jsonb_agg(jsonb_build_object('page', page, 'n', n) ORDER BY n DESC) FROM (
        SELECT page, sum(vues)::int AS n FROM public.stats_pages_jour, b WHERE jour >= b.d AND jour < b.f GROUP BY page ORDER BY n DESC LIMIT 6) x), '[]'::jsonb),
    'vues_fiches', (SELECT coalesce(sum(vues), 0) FROM public.stats_fiches_jour, b WHERE jour >= b.d AND jour < b.f),
    'vues_fiches_avant', (SELECT coalesce(sum(vues), 0) FROM public.stats_fiches_jour, b WHERE jour >= b.pd AND jour < b.d),
    'ecoutes', (SELECT coalesce(sum(ecoutes), 0) FROM public.stats_fiches_jour, b WHERE jour >= b.d AND jour < b.f),
    'ecoutes_avant', (SELECT coalesce(sum(ecoutes), 0) FROM public.stats_fiches_jour, b WHERE jour >= b.pd AND jour < b.d),
    'fiches', coalesce((SELECT jsonb_agg(jsonb_build_object('nom', nom, 'vues', vues, 'ecoutes', ecoutes) ORDER BY vues DESC, ecoutes DESC) FROM (
        SELECT CASE WHEN coalesce(nullif(btrim(p.nom_podcast), ''), '—') !~ '^[—–\-.\s]+$' THEN btrim(p.nom_podcast)
                    ELSE coalesce(nullif(btrim(concat_ws(' ', p.prenom, p.nom)), ''), p.structure, 'Sans titre') END AS nom,
               sum(s.vues)::int AS vues, sum(s.ecoutes)::int AS ecoutes
        FROM public.stats_fiches_jour s JOIN public.podcasts p ON p.id = s.podcast_id, b
        WHERE s.jour >= b.d AND s.jour < b.f GROUP BY 1 ORDER BY 2 DESC, 3 DESC LIMIT 5) x), '[]'::jsonb),
    'messages', (SELECT count(*) FROM public.contact_requests c, b WHERE c.created_at >= b.ts_d AND c.created_at < b.ts_f AND c.type = 'message'),
    'collabs', (SELECT count(*) FROM public.contact_requests c, b WHERE c.created_at >= b.ts_d AND c.created_at < b.ts_f AND c.type = 'collab'),
    'devis', (SELECT count(*) FROM public.demandes_devis c, b WHERE c.created_at >= b.ts_d AND c.created_at < b.ts_f),
    'demandes_avant', (SELECT count(*) FROM public.contact_requests c, b WHERE c.created_at >= b.ts_pd AND c.created_at < b.ts_d),
    'inscriptions', (SELECT count(*) FROM public.evenement_inscriptions i, b WHERE i.created_at >= b.ts_d AND i.created_at < b.ts_f),
    'adhesions', (SELECT count(*) FROM public.adhesions a, b WHERE a.created_at >= b.ts_d AND a.created_at < b.ts_f AND a.statut <> 'expired'),
    'nouvelles_fiches', (SELECT count(DISTINCT lower(p.email)) FROM public.podcasts p, b WHERE p.created_at >= b.ts_d AND p.created_at < b.ts_f),
    'propositions', (SELECT count(*) FROM public.evenements_proposeurs e, b WHERE e.created_at >= b.ts_d AND e.created_at < b.ts_f)
  )
$function$;
REVOKE ALL ON FUNCTION public.rapport_semaine(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rapport_semaine(date) TO service_role;