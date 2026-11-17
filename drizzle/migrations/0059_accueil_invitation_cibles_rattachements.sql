CREATE OR REPLACE FUNCTION public.accueil_invitation_cibles()
 RETURNS TABLE(email text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Une personne = l'adresse du membre. Un paiement fait sous un autre nom et rattaché
  -- à un membre ne compte que pour ce membre, pas pour l'adresse qui a payé.
  WITH gens AS (
    SELECT DISTINCT lower(a.email) AS e FROM public.adhesions a
    WHERE a.email IS NOT NULL AND a.statut = 'active'
      AND NOT EXISTS (SELECT 1 FROM public.adhesion_rattachements r WHERE r.adhesion_id = a.id)
    UNION
    SELECT DISTINCT lower(r.email_membre) FROM public.adhesion_rattachements r
  )
  SELECT g.e FROM gens g
  LEFT JOIN public.membres_accueil m ON m.email = g.e
  WHERE public.membre_a_jour(g.e)
    AND g.e !~* '(@invalid|\.invalid|@example\.(com|org|net))$'
    AND m.whatsapp_rejoint_le IS NULL AND m.bienvenue_le IS NULL AND m.invitation_le IS NULL AND m.relances_refusees_le IS NULL
  ORDER BY g.e;
$function$;