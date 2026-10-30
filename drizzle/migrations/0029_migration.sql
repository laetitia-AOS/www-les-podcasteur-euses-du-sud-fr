-- Inscription : la fiche « profil seul » d'un·e podcasteur·euse (enregistrée dès l'étape 1)
-- est remplacée par ses vraies fiches podcast quand elle les ajoute (même e-mail, dans les 24 h).
CREATE OR REPLACE FUNCTION public.remplacer_profil_provisoire()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type_profil = 'podcasteur' AND coalesce(NEW.nom_podcast, '') NOT IN ('', '—') THEN
    BEGIN
      DELETE FROM public.podcasts p
      WHERE lower(p.email) = lower(NEW.email)
        AND p.id <> NEW.id
        AND p.type_profil = 'podcasteur'
        AND p.nom_podcast = '—'
        AND p.created_at > now() - interval '24 hours'
        AND NOT EXISTS (SELECT 1 FROM public.contact_requests c WHERE c.recipient_id = p.id);
    EXCEPTION WHEN others THEN
      NULL; -- la fiche provisoire reste en place, l'admin pourra la retirer
    END;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_90_remplacer_profil_provisoire ON public.podcasts;
CREATE TRIGGER trg_90_remplacer_profil_provisoire
AFTER INSERT ON public.podcasts
FOR EACH ROW EXECUTE FUNCTION public.remplacer_profil_provisoire();

REVOKE EXECUTE ON FUNCTION public.remplacer_profil_provisoire() FROM PUBLIC, anon, authenticated;