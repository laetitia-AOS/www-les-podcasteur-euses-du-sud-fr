CREATE TABLE public.relances_profil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  manques text[] NOT NULL DEFAULT '{}',
  envoye_le timestamptz NOT NULL DEFAULT now(),
  envoye_par uuid
);
CREATE INDEX relances_profil_email_idx ON public.relances_profil (lower(email), envoye_le DESC);
GRANT SELECT ON public.relances_profil TO authenticated;
GRANT ALL ON public.relances_profil TO service_role;
ALTER TABLE public.relances_profil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins lisent les relances de profil" ON public.relances_profil
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fiches à compléter, une ligne par personne (réservé aux admins)
CREATE OR REPLACE FUNCTION public.admin_profils_a_completer()
RETURNS TABLE(email text, nom text, type_profil text, fiche_validee boolean, sans_photo boolean,
  podcasts_sans_pochette text[], podcasts_sans_rss text[], sans_collab boolean,
  derniere_relance timestamptz, nb_relances integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH p AS (
    SELECT lower(trim(x.email)) AS em, x.* FROM podcasts x
    WHERE public.has_role(auth.uid(), 'admin')
  ), r AS (
    SELECT lower(trim(rp.email)) AS em, max(rp.envoye_le) AS derniere, count(*)::int AS nb
    FROM relances_profil rp GROUP BY 1
  )
  SELECT p.em,
    max(trim(concat_ws(' ', p.prenom, p.nom))) FILTER (WHERE coalesce(trim(concat_ws(' ', p.prenom, p.nom)),'') <> '')
      ,
    (array_agg(p.type_profil ORDER BY p.created_at))[1],
    bool_or(p.valide),
    NOT bool_or(coalesce(p.photo_profil_url,'') <> ''),
    coalesce(array_agg(p.nom_podcast ORDER BY p.nom_podcast) FILTER (WHERE p.type_profil = 'podcasteur' AND coalesce(p.vignette_url,'') = ''), '{}'),
    coalesce(array_agg(p.nom_podcast ORDER BY p.nom_podcast) FILTER (WHERE p.type_profil = 'podcasteur' AND coalesce(p.flux_rss,'') = ''), '{}'),
    bool_or(coalesce(array_length(p.apporte_choix,1),0) = 0 OR coalesce(array_length(p.cherche_choix,1),0) = 0),
    r.derniere, coalesce(r.nb, 0)
  FROM p LEFT JOIN r ON r.em = p.em
  GROUP BY p.em, r.derniere, r.nb
  ORDER BY 2 NULLS LAST;
$$;
REVOKE ALL ON FUNCTION public.admin_profils_a_completer() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_profils_a_completer() TO authenticated;