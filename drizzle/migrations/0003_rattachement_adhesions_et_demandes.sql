-- Rattachement manuel d'un paiement HelloAsso à un compte membre (adresse e-mail du profil), réservé aux administrateur·ices.
CREATE TABLE public.adhesion_rattachements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adhesion_id uuid NOT NULL REFERENCES public.adhesions(id) ON DELETE CASCADE,
  email_membre text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX adhesion_rattachements_unique ON public.adhesion_rattachements (adhesion_id, lower(email_membre));
CREATE INDEX adhesion_rattachements_email ON public.adhesion_rattachements (lower(email_membre));

GRANT SELECT, INSERT, DELETE ON public.adhesion_rattachements TO authenticated;
GRANT ALL ON public.adhesion_rattachements TO service_role;

ALTER TABLE public.adhesion_rattachements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read rattachements" ON public.adhesion_rattachements
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert rattachements" ON public.adhesion_rattachements
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete rattachements" ON public.adhesion_rattachements
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- À l'enregistrement : e-mail normalisé, auteur·ice noté·e, et activation des fiches complètes comme pour un paiement direct.
CREATE OR REPLACE FUNCTION public.on_adhesion_rattachement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email_membre := lower(trim(NEW.email_membre));
  NEW.created_by := auth.uid();
  IF NEW.email_membre = '' THEN
    RAISE EXCEPTION 'Adresse e-mail du membre manquante';
  END IF;
  IF EXISTS (SELECT 1 FROM public.adhesions a WHERE a.id = NEW.adhesion_id AND a.statut = 'active') THEN
    UPDATE public.podcasts
    SET valide = true
    WHERE lower(email) = NEW.email_membre
      AND valide = false
      AND vignette_url IS NOT NULL AND vignette_url <> ''
      AND nom_podcast IS NOT NULL AND length(nom_podcast) >= 3
      AND description IS NOT NULL AND length(description) >= 20
      AND thematique IS NOT NULL AND thematique <> ''
      AND lien_ecoute ~ '^https?://(www\.)?(open\.spotify\.com|podcasters\.spotify\.com|podcasts\.apple\.com|music\.amazon\.com|amazon\.com|deezer\.com|youtube\.com|youtu\.be|soundcloud\.com|podcloud\.fr|ausha\.co|acast\.com|anchor\.fm|spreaker\.com|podbean\.com|castbox\.fm|overcast\.fm|pocketcasts\.com|listen\.pocketcasts\.com|pod\.link|smartlink\.|linktr\.ee|bfrn\.co|feeds\.buzzsprout\.com|buzzsprout\.com|simplecast\.com|transistor\.fm|captivate\.fm|megaphone\.fm|omnystudio\.com|audiomeans\.fr|podcastics\.com|rfrn\.co|radiofrance\.fr|arte\.tv|radiomeuh\.com|luminary\.link|stitcher\.com|tunein\.com|iheart\.com|pandora\.com|player\.fm|castro\.fm|fountain\.fm|goodpods\.com)/';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.on_adhesion_rattachement() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_adhesion_rattachement
  BEFORE INSERT ON public.adhesion_rattachements
  FOR EACH ROW EXECUTE FUNCTION public.on_adhesion_rattachement();

-- Statut d'adhésion du membre connecté : paiements à son adresse ou rattachés à son compte.
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
    AND (
      lower(a.email) = lower(auth.jwt() ->> 'email')
      OR a.id IN (
        SELECT r.adhesion_id FROM public.adhesion_rattachements r
        WHERE r.email_membre = lower(auth.jwt() ->> 'email')
      )
    )
  ORDER BY a.date_adhesion DESC NULLS LAST
  LIMIT 1
$$;

-- Messages reçus : visibles par le membre uniquement à partir du 28 octobre 2026 (heure de Paris).
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
    AND c.created_at >= timestamptz '2026-10-28 00:00:00 Europe/Paris'
    AND c.recipient_id IN (
      SELECT p.id FROM public.podcasts p WHERE lower(p.email) = lower(auth.jwt() ->> 'email')
    )
  ORDER BY c.created_at DESC
  LIMIT 50
$$;

REVOKE ALL ON FUNCTION public.mon_adhesion() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mes_demandes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_adhesion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mes_demandes() TO authenticated;