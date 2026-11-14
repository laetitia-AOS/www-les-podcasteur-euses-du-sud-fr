-- L'Onde du Sud : réglage « Lien de don » (pied fixe des numéros) et réabonnement d'un·e membre désinscrit·e.

-- Une seule ligne de réglages. Aucun accès direct : lecture publique par onde_lien_don(),
-- modification par onde_regler_lien_don() (admins et éditeur·ices, lien https vérifié).
CREATE TABLE public.onde_reglages (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  lien_don text CHECK (lien_don IS NULL OR (lien_don ~* '^https://' AND length(lien_don) <= 500)),
  modifie_par uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.onde_reglages IS 'Réglages de L''Onde du Sud (une ligne). Lecture : onde_lien_don() ; écriture : onde_regler_lien_don().';
GRANT ALL ON public.onde_reglages TO service_role;
ALTER TABLE public.onde_reglages ENABLE ROW LEVEL SECURITY;
-- Aucune règle pour anon ni authenticated : aucune lecture ni écriture directe.

CREATE OR REPLACE FUNCTION public.onde_lien_don()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.lien_don FROM public.onde_reglages r WHERE r.id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.onde_regler_lien_don(_lien text)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE l text;
BEGIN
  IF NOT public.peut_editer_onde() THEN
    RAISE EXCEPTION 'Réservé aux admins et aux éditeur·ices de L''Onde du Sud.' USING ERRCODE = '42501';
  END IF;
  l := nullif(btrim(coalesce(_lien, '')), '');
  IF l IS NOT NULL THEN
    IF length(l) > 500 THEN
      RAISE EXCEPTION 'Le lien est trop long (500 caractères au maximum).' USING ERRCODE = 'P0001';
    END IF;
    IF l !~* '^https://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]{1,5})?([/?#][^[:space:]<>"''`\\]*)?$' THEN
      RAISE EXCEPTION 'Le lien de don doit être une adresse complète qui commence par https://' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  INSERT INTO public.onde_reglages (id, lien_don, modifie_par, updated_at)
  VALUES (true, l, auth.uid(), now())
  ON CONFLICT (id) DO UPDATE SET lien_don = EXCLUDED.lien_don, modifie_par = EXCLUDED.modifie_par, updated_at = now();
  RETURN l;
END $$;

-- Pour la personne connectée : est-elle adhérente à jour, et où en est son abonnement ?
-- L'adresse vient de la session, jamais de la requête.
CREATE OR REPLACE FUNCTION public.mon_abonnement_onde()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  e text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  s text;
BEGIN
  IF auth.uid() IS NULL OR e = '' THEN
    RETURN jsonb_build_object('membre', false, 'statut', NULL);
  END IF;
  SELECT a.statut INTO s FROM public.onde_abonnes a WHERE lower(a.email) = e;
  RETURN jsonb_build_object('membre', public.membre_a_jour(e), 'statut', s);
END $$;

-- « Me réabonner » en un clic : un·e adhérent·e à jour connecté·e qui s'était désinscrit·e.
-- L'adresse vient de la session (déjà vérifiée), le consentement est enregistré avec la date.
CREATE OR REPLACE FUNCTION public.onde_me_reabonner()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  e text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
BEGIN
  IF auth.uid() IS NULL OR e = '' THEN
    RAISE EXCEPTION 'Connecte-toi pour te réabonner.' USING ERRCODE = '42501';
  END IF;
  IF NOT public.membre_a_jour(e) THEN
    RAISE EXCEPTION 'Le réabonnement en un clic est réservé aux adhérent·es à jour : inscris-toi avec le formulaire.' USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.onde_abonnes
  SET statut = 'actif', confirme_le = coalesce(confirme_le, now()), desinscrit_le = NULL,
    consentement_le = now(), consentement_texte = public.onde_texte_consentement('reinscription'), updated_at = now()
  WHERE lower(email) = e AND statut = 'desinscrit';
  RETURN 'actif';
END $$;

REVOKE ALL ON FUNCTION public.onde_lien_don() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.onde_regler_lien_don(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mon_abonnement_onde() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.onde_me_reabonner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onde_lien_don() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onde_regler_lien_don(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mon_abonnement_onde() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.onde_me_reabonner() TO authenticated, service_role;
