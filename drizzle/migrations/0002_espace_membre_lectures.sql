-- Lectures en lecture seule pour l'espace membre : chaque fonction ne renvoie que les données liées à l'e-mail de la personne connectée.

CREATE OR REPLACE FUNCTION public.mon_adhesion()
RETURNS TABLE (date_adhesion timestamptz, type_adhesion text, statut text, montant numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.date_adhesion, a.type_adhesion, a.statut, a.montant
  FROM public.adhesions a
  WHERE coalesce(auth.jwt() ->> 'email', '') <> ''
    AND lower(a.email) = lower(auth.jwt() ->> 'email')
  ORDER BY a.date_adhesion DESC NULLS LAST
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.mes_demandes()
RETURNS TABLE (id uuid, recipient_id uuid, sender_name text, sender_email text, message text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.recipient_id, c.sender_name, c.sender_email, c.message, c.created_at
  FROM public.contact_requests c
  WHERE coalesce(auth.jwt() ->> 'email', '') <> ''
    AND c.recipient_id IN (
      SELECT p.id FROM public.podcasts p WHERE lower(p.email) = lower(auth.jwt() ->> 'email')
    )
  ORDER BY c.created_at DESC
  LIMIT 50
$$;

CREATE OR REPLACE FUNCTION public.mes_evenements()
RETURNS TABLE (id uuid, titre text, slug text, date_debut timestamptz, publie boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.titre, e.slug, e.date_debut, e.publie
  FROM public.evenements e
  WHERE coalesce(auth.jwt() ->> 'email', '') <> ''
    AND position(lower('(' || (auth.jwt() ->> 'email') || ')') IN lower(coalesce(e.description, ''))) > 0
  ORDER BY e.date_debut DESC
  LIMIT 50
$$;

REVOKE ALL ON FUNCTION public.mon_adhesion() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mes_demandes() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mes_evenements() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_adhesion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mes_demandes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mes_evenements() TO authenticated;