-- Ce que le public voit des fiches, identique pour tout le monde : une personne admin ou la ou le membre
-- connecté·e voient sur les pages du site exactement ce que voit un·e visiteur·ice (fiche masquée = absente).
CREATE VIEW public.podcasts_publics WITH (security_invoker = on) AS
  SELECT * FROM public.podcasts p WHERE p.valide AND public.podcast_visible(p.id);

COMMENT ON VIEW public.podcasts_publics IS 'Fiches visibles du public (valide + podcast_visible). Les pages publiques lisent cette vue, jamais la table, pour que les admins voient le site comme les visiteur·ices.';

GRANT SELECT ON public.podcasts_publics TO anon, authenticated, service_role;