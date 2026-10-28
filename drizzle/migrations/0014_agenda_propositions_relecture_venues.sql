ALTER TABLE public.evenements
  ADD COLUMN IF NOT EXISTS origine text NOT NULL DEFAULT 'pds',
  ADD COLUMN IF NOT EXISTS propose_par uuid REFERENCES public.podcasts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS propose_par_nom text,
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'sur_place',
  ADD COLUMN IF NOT EXISTS lien_connexion text,
  ADD COLUMN IF NOT EXISTS tarif text,
  ADD COLUMN IF NOT EXISTS statut text NOT NULL DEFAULT 'publie',
  ADD COLUMN IF NOT EXISTS motif_refus text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.evenements SET statut = CASE WHEN publie THEN 'publie' ELSE 'en_relecture' END;
UPDATE public.evenements SET type = CASE
  WHEN type IN ('apero_ecoute','atelier','live','ecoute','rencontre','autre') THEN type ELSE 'autre' END;

ALTER TABLE public.evenements DROP CONSTRAINT IF EXISTS evenements_origine_check;
ALTER TABLE public.evenements ADD CONSTRAINT evenements_origine_check CHECK (origine IN ('pds','membre'));
ALTER TABLE public.evenements DROP CONSTRAINT IF EXISTS evenements_format_check;
ALTER TABLE public.evenements ADD CONSTRAINT evenements_format_check CHECK (format IN ('sur_place','en_ligne'));
ALTER TABLE public.evenements DROP CONSTRAINT IF EXISTS evenements_statut_check;
ALTER TABLE public.evenements ADD CONSTRAINT evenements_statut_check CHECK (statut IN ('en_relecture','publie','refuse'));
ALTER TABLE public.evenements DROP CONSTRAINT IF EXISTS evenements_type_check;
ALTER TABLE public.evenements ADD CONSTRAINT evenements_type_check CHECK (type IN ('apero_ecoute','atelier','live','ecoute','rencontre','autre'));
ALTER TABLE public.evenements ALTER COLUMN type SET DEFAULT 'rencontre';
COMMENT ON COLUMN public.evenements.publie IS 'Recalculé depuis statut (statut = publie) ; gardé pour la version publiée précédente et l''aperçu de partage';

CREATE TABLE public.evenements_proposeurs (
  evenement_id uuid PRIMARY KEY REFERENCES public.evenements(id) ON DELETE CASCADE,
  email text NOT NULL,
  podcast_id uuid REFERENCES public.podcasts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evenements_proposeurs_email_idx ON public.evenements_proposeurs (lower(email), created_at);
GRANT SELECT ON public.evenements_proposeurs TO authenticated;
GRANT ALL ON public.evenements_proposeurs TO service_role;
ALTER TABLE public.evenements_proposeurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Le membre voit ses propositions, les admins tout" ON public.evenements_proposeurs FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR public.has_role(auth.uid(), 'admin'));

INSERT INTO public.evenements_proposeurs (evenement_id, email, podcast_id)
SELECT e.id, lower(m[1]),
  (SELECT p.id FROM public.podcasts p WHERE lower(p.email) = lower(m[1]) ORDER BY (p.type_profil = 'podcasteur'), p.created_at LIMIT 1)
FROM public.evenements e
CROSS JOIN LATERAL regexp_match(coalesce(e.description, ''), '\(([^()\s]+@[^()\s]+)\)\s*$') AS m
WHERE m IS NOT NULL AND m[1] IS NOT NULL
ON CONFLICT DO NOTHING;
UPDATE public.evenements e SET origine = 'membre', propose_par = ep.podcast_id,
  propose_par_nom = nullif(trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')), '')
FROM public.evenements_proposeurs ep JOIN public.podcasts p ON p.id = ep.podcast_id
WHERE ep.evenement_id = e.id;

CREATE OR REPLACE FUNCTION public.mon_evenement(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') <> '' AND EXISTS (
    SELECT 1 FROM public.evenements_proposeurs ep WHERE ep.evenement_id = _id AND lower(ep.email) = lower(auth.jwt() ->> 'email'))
$$;
REVOKE EXECUTE ON FUNCTION public.mon_evenement(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mon_evenement(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.peut_proposer_evenement()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') <> ''
    AND public.membre_a_jour(auth.jwt() ->> 'email')
    AND EXISTS (SELECT 1 FROM public.podcasts p WHERE lower(p.email) = lower(auth.jwt() ->> 'email'))
$$;
REVOKE EXECUTE ON FUNCTION public.peut_proposer_evenement() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.peut_proposer_evenement() TO authenticated;

CREATE OR REPLACE FUNCTION public.pds_evenement_champs(NEW public.evenements)
RETURNS public.evenements LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.titre := public.pds_txt(NEW.titre, 150, 'Titre', true);
  NEW.sous_titre := public.pds_txt(NEW.sous_titre, 200, 'Sous-titre');
  NEW.description := public.pds_txt(NEW.description, 6000, 'Description');
  NEW.lieu := public.pds_txt(NEW.lieu, 200, 'Lieu');
  NEW.adresse := public.pds_txt(NEW.adresse, 250, 'Adresse');
  NEW.tarif := public.pds_txt(NEW.tarif, 80, 'Tarif');
  NEW.lien_externe := public.pds_url(NEW.lien_externe, 'Lien d''inscription');
  NEW.lien_connexion := public.pds_url(NEW.lien_connexion, 'Lien de connexion');
  NEW.image_url := public.pds_url(NEW.image_url, 'Visuel');
  IF NEW.lien_connexion IS NOT NULL AND NEW.lien_connexion !~* '^https://' THEN
    RAISE EXCEPTION 'Le lien de connexion doit commencer par https://' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.lien_externe IS NOT NULL AND NEW.lien_externe !~* '^https://' THEN
    RAISE EXCEPTION 'Le lien d''inscription doit commencer par https://' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.places IS NOT NULL AND (NEW.places < 1 OR NEW.places > 100000) THEN
    RAISE EXCEPTION 'Nombre de places invalide.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.date_fin IS NOT NULL AND NEW.date_fin < NEW.date_debut THEN
    RAISE EXCEPTION 'La date de fin doit suivre la date de début.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.pds_evenement_champs(public.evenements) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_evenements()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE mail text := lower(coalesce(auth.jwt() ->> 'email', '')); fiche record;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    NEW.publie := (NEW.statut = 'publie');
    RETURN NEW;
  END IF;
  IF mail = '' OR NOT public.membre_a_jour(mail) THEN
    RAISE EXCEPTION 'Seuls les membres à jour de cotisation peuvent proposer un événement.' USING ERRCODE = 'P0001';
  END IF;
  SELECT p.id, p.prenom, p.nom, p.nom_podcast INTO fiche FROM public.podcasts p
    WHERE lower(p.email) = mail ORDER BY (p.type_profil = 'podcasteur'), p.created_at LIMIT 1;
  IF fiche.id IS NULL THEN
    RAISE EXCEPTION 'Aucune fiche n''est liée à votre adresse.' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(*) FROM public.evenements_proposeurs ep WHERE lower(ep.email) = mail AND ep.created_at > now() - interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'Vous avez proposé 5 événements aujourd''hui. Réessayez demain.' USING ERRCODE = 'P0001', HINT = 'rate_limit';
  END IF;
  NEW := public.pds_evenement_champs(NEW);
  IF NEW.date_debut < now() - interval '1 day' OR NEW.date_debut > now() + interval '3 years' THEN
    RAISE EXCEPTION 'Date de début invalide.' USING ERRCODE = 'P0001';
  END IF;
  NEW.statut := 'en_relecture';
  NEW.publie := false;
  NEW.origine := 'membre';
  NEW.propose_par := fiche.id;
  NEW.propose_par_nom := coalesce(nullif(trim(coalesce(fiche.prenom, '') || ' ' || coalesce(fiche.nom, '')), ''), fiche.nom_podcast);
  NEW.motif_refus := NULL;
  NEW.inscription_activee := false;
  NEW.podcasts_invites := '[]'::jsonb;
  NEW.structure_id := NULL;
  NEW.created_at := now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.after_evenement_propose()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.origine = 'membre' AND NOT public.has_role(auth.uid(), 'admin') AND coalesce(auth.jwt() ->> 'email', '') <> '' THEN
    INSERT INTO public.evenements_proposeurs (evenement_id, email, podcast_id)
    VALUES (NEW.id, lower(auth.jwt() ->> 'email'), NEW.propose_par) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_after_evenement_propose ON public.evenements;
CREATE TRIGGER trg_after_evenement_propose AFTER INSERT ON public.evenements
  FOR EACH ROW EXECUTE FUNCTION public.after_evenement_propose();

CREATE OR REPLACE FUNCTION public.guard_evenements_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF public.has_role(auth.uid(), 'admin') THEN
    IF NEW.statut IS NOT DISTINCT FROM OLD.statut AND NEW.publie IS DISTINCT FROM OLD.publie THEN
      NEW.statut := CASE WHEN NEW.publie THEN 'publie' ELSE 'en_relecture' END;
    END IF;
    NEW.publie := (NEW.statut = 'publie');
    IF NEW.statut <> 'refuse' THEN NEW.motif_refus := NULL; END IF;
    RETURN NEW;
  END IF;
  -- Appels internes du serveur (sans compte) : le statut ne change jamais
  IF auth.uid() IS NULL THEN
    NEW.statut := OLD.statut; NEW.publie := OLD.publie; NEW.motif_refus := OLD.motif_refus;
    RETURN NEW;
  END IF;
  IF OLD.statut <> 'en_relecture' OR NOT public.mon_evenement(OLD.id) THEN
    RAISE EXCEPTION 'Cette proposition ne peut plus être modifiée.' USING ERRCODE = 'P0001';
  END IF;
  NEW := public.pds_evenement_champs(NEW);
  NEW.statut := OLD.statut;
  NEW.publie := OLD.publie;
  NEW.origine := OLD.origine;
  NEW.propose_par := OLD.propose_par;
  NEW.propose_par_nom := OLD.propose_par_nom;
  NEW.motif_refus := OLD.motif_refus;
  NEW.inscription_activee := OLD.inscription_activee;
  NEW.podcasts_invites := OLD.podcasts_invites;
  NEW.structure_id := OLD.structure_id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_00_guard_evenements_update ON public.evenements;
CREATE TRIGGER trg_00_guard_evenements_update BEFORE UPDATE ON public.evenements
  FOR EACH ROW EXECUTE FUNCTION public.guard_evenements_update();

DROP POLICY IF EXISTS "Anyone can submit an event" ON public.evenements;
DROP POLICY IF EXISTS "Evenements publiés visibles par tous" ON public.evenements;
CREATE POLICY "Evenements publies visibles par tous" ON public.evenements FOR SELECT TO anon, authenticated
  USING (statut = 'publie');
CREATE POLICY "Le membre voit ses propositions" ON public.evenements FOR SELECT TO authenticated
  USING (public.mon_evenement(id));
CREATE POLICY "Les membres a jour proposent" ON public.evenements FOR INSERT TO authenticated
  WITH CHECK (public.peut_proposer_evenement());
CREATE POLICY "Le membre modifie sa proposition en relecture" ON public.evenements FOR UPDATE TO authenticated
  USING (public.mon_evenement(id) AND statut = 'en_relecture')
  WITH CHECK (public.mon_evenement(id));
CREATE POLICY "Le membre retire sa proposition en relecture" ON public.evenements FOR DELETE TO authenticated
  USING (public.mon_evenement(id) AND statut = 'en_relecture');
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.evenements FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evenements TO authenticated;

ALTER TABLE public.evenement_inscriptions ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE OR REPLACE FUNCTION public.guard_evenement_inscriptions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE evt record; mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF public.has_role(auth.uid(), 'admin') AND NEW.user_id IS NULL THEN RETURN NEW; END IF;
  IF auth.uid() IS NOT NULL AND mail <> '' THEN
    NEW.user_id := auth.uid();
    NEW.email := mail;
  ELSE
    NEW.user_id := NULL;
  END IF;
  NEW.prenom := public.pds_txt(NEW.prenom, 100, 'Nom', true);
  NEW.nom := coalesce(public.pds_txt(NEW.nom, 100, 'Nom'), '');
  NEW.email := public.pds_email(NEW.email);
  NEW.telephone := public.pds_tel(NEW.telephone);
  NEW.structure := public.pds_txt(NEW.structure, 150, 'Structure');
  NEW.statut := 'confirmee';
  NEW.created_at := now();
  SELECT e.statut, e.places, coalesce(e.date_fin, e.date_debut) AS fin INTO evt FROM public.evenements e WHERE e.id = NEW.evenement_id;
  IF evt.statut IS DISTINCT FROM 'publie' OR evt.fin <= now() THEN
    RAISE EXCEPTION 'Cet événement ne prend plus de réponses.' USING ERRCODE = 'P0001';
  END IF;
  IF evt.places IS NOT NULL AND (SELECT count(*) FROM public.evenement_inscriptions i WHERE i.evenement_id = NEW.evenement_id AND i.statut = 'confirmee') >= evt.places THEN
    RAISE EXCEPTION 'Complet : toutes les places sont prises.' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(DISTINCT i.created_at) FROM public.evenement_inscriptions i
      WHERE lower(i.email) = NEW.email AND i.created_at > now() - interval '1 hour') >= 5 THEN
    PERFORM public.pds_trop_d_envois();
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.nb_venues(_evenement_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.evenement_inscriptions i
  JOIN public.evenements e ON e.id = i.evenement_id AND e.statut = 'publie'
  WHERE i.evenement_id = _evenement_id AND i.statut = 'confirmee'
$$;
REVOKE EXECUTE ON FUNCTION public.nb_venues(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.nb_venues(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.je_viens_deja(_evenement_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') <> '' AND EXISTS (
    SELECT 1 FROM public.evenement_inscriptions i
    WHERE i.evenement_id = _evenement_id AND lower(i.email) = lower(auth.jwt() ->> 'email'))
$$;
REVOKE EXECUTE ON FUNCTION public.je_viens_deja(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.je_viens_deja(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mes_venues(_evenement_id uuid)
RETURNS TABLE(prenom text, nom text, email text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.prenom, i.nom, i.email, i.created_at FROM public.evenement_inscriptions i
  WHERE i.evenement_id = _evenement_id AND i.statut = 'confirmee'
    AND (public.mon_evenement(_evenement_id) OR public.has_role(auth.uid(), 'admin'))
  ORDER BY i.created_at
$$;
REVOKE EXECUTE ON FUNCTION public.mes_venues(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mes_venues(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.mes_evenements();
CREATE FUNCTION public.mes_evenements()
RETURNS TABLE(id uuid, titre text, slug text, date_debut timestamptz, publie boolean, statut text, motif_refus text, nb_venues integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.titre, e.slug, e.date_debut, e.publie, e.statut, e.motif_refus,
    (SELECT count(*)::int FROM public.evenement_inscriptions i WHERE i.evenement_id = e.id AND i.statut = 'confirmee')
  FROM public.evenements e JOIN public.evenements_proposeurs ep ON ep.evenement_id = e.id
  WHERE coalesce(auth.jwt() ->> 'email', '') <> '' AND lower(ep.email) = lower(auth.jwt() ->> 'email')
  ORDER BY e.date_debut DESC
  LIMIT 50
$$;
REVOKE EXECUTE ON FUNCTION public.mes_evenements() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mes_evenements() TO authenticated;