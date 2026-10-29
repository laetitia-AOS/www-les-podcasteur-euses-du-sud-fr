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
  DELETE FROM public.adhesion_rattachements WHERE email_membre = m;
  DELETE FROM public.podcasts WHERE id = ANY(ids);
  UPDATE public.adhesions SET email = NULL, prenom = NULL, nom = NULL, telephone = NULL,
    raw_payload = jsonb_build_object('anonymise_le', now())
    WHERE lower(email) = m;
  RETURN images;
END $function$;
REVOKE ALL ON FUNCTION public.effacer_donnees_membre(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.effacer_donnees_membre(text) TO service_role;