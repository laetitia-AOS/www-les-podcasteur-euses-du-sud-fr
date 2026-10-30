-- Fiche provisoire aussi remplacée quand la personne, connectée, ajoute son podcast plus tard.
CREATE OR REPLACE FUNCTION public.remplacer_profil_provisoire()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE moi boolean := lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(NEW.email, ''));
BEGIN
  IF NEW.type_profil = 'podcasteur' AND coalesce(NEW.nom_podcast, '') NOT IN ('', '—') THEN
    BEGIN
      DELETE FROM public.podcasts p
      WHERE lower(p.email) = lower(NEW.email)
        AND p.id <> NEW.id
        AND p.type_profil = 'podcasteur'
        AND p.nom_podcast = '—'
        AND (moi OR p.created_at > now() - interval '24 hours')
        AND NOT EXISTS (SELECT 1 FROM public.contact_requests c WHERE c.recipient_id = p.id);
    EXCEPTION WHEN others THEN
      NULL; -- la fiche provisoire reste en place, l'admin pourra la retirer
    END;
  END IF;
  RETURN NULL;
END $$;

REVOKE EXECUTE ON FUNCTION public.remplacer_profil_provisoire() FROM PUBLIC, anon, authenticated;