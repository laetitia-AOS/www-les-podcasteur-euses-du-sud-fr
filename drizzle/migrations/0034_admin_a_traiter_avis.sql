-- Ajoute les avis signalés aux compteurs d'attente de l'administration.
DROP FUNCTION public.admin_a_traiter();

CREATE OR REPLACE FUNCTION public.admin_a_traiter()
 RETURNS TABLE(images integer, fiches integer, propositions integer, paiements integer, contacts integer, messages_membres integer, flux integer, avis integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT count(*)::int FROM images_en_attente WHERE statut = 'en_attente'),
    (SELECT count(*)::int FROM podcasts WHERE NOT valide),
    (SELECT count(*)::int FROM evenements WHERE statut = 'en_relecture'),
    (SELECT count(*)::int FROM adhesions WHERE statut = 'a_verifier'),
    (SELECT count(*)::int FROM contacts WHERE statut = 'Nouveau'),
    (SELECT count(*)::int FROM contact_requests WHERE status = 'pending'),
    (SELECT count(*)::int FROM flux_etat WHERE confirmation = 'a_confirmer' AND flux_url IS NOT NULL AND source IS NOT NULL AND source <> 'flux saisi'),
    (SELECT count(*)::int FROM avis WHERE signale AND statut = 'publie')
  WHERE public.has_role(auth.uid(), 'admin');
$function$;