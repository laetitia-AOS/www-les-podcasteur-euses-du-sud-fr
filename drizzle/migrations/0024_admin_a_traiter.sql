-- Compteurs « À traiter » de l'administration (rien pour qui n'est pas admin)
CREATE OR REPLACE FUNCTION public.admin_a_traiter()
RETURNS TABLE(images integer, fiches integer, propositions integer, paiements integer, contacts integer, messages_membres integer, flux integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*)::int FROM images_en_attente WHERE statut = 'en_attente'),
    (SELECT count(*)::int FROM podcasts WHERE NOT valide),
    (SELECT count(*)::int FROM evenements WHERE statut = 'en_relecture'),
    (SELECT count(*)::int FROM adhesions WHERE statut = 'a_verifier'),
    (SELECT count(*)::int FROM contacts WHERE statut = 'Nouveau'),
    (SELECT count(*)::int FROM contact_requests WHERE status = 'pending'),
    (SELECT count(*)::int FROM flux_etat WHERE confirmation = 'a_confirmer' AND flux_url IS NOT NULL AND source IS NOT NULL AND source <> 'flux saisi')
  WHERE public.has_role(auth.uid(), 'admin');
$$;
REVOKE ALL ON FUNCTION public.admin_a_traiter() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_a_traiter() TO authenticated;