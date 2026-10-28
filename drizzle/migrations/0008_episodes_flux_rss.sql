CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Membre à jour : adhésion active (ou rattachée), datée de 2026 ou après et de moins de 12 mois.
CREATE OR REPLACE FUNCTION public.membre_a_jour(_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(_email, '') <> '' AND EXISTS (
    SELECT 1 FROM public.adhesions a
    WHERE a.statut = 'active'
      AND a.date_adhesion >= timestamptz '2026-01-01 00:00:00 Europe/Paris'
      AND a.date_adhesion > now() - interval '12 months'
      AND (lower(a.email) = lower(_email)
           OR a.id IN (SELECT r.adhesion_id FROM public.adhesion_rattachements r WHERE r.email_membre = lower(_email)))
  )
$$;
REVOKE EXECUTE ON FUNCTION public.membre_a_jour(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.membre_a_jour(text) TO service_role;

-- Un podcast dont les épisodes sont publics : fiche visible + membre à jour. Ne révèle rien d'autre.
CREATE OR REPLACE FUNCTION public.episodes_visibles(_podcast_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.podcasts p WHERE p.id = _podcast_id AND p.valide AND public.membre_a_jour(p.email))
$$;
REVOKE EXECUTE ON FUNCTION public.episodes_visibles(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.episodes_visibles(uuid) TO anon, authenticated, service_role;

-- Épisodes : 10 derniers par podcast, écrits uniquement par la fonction serveur.
CREATE TABLE public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id uuid NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  guid text NOT NULL,
  titre text NOT NULL CHECK (char_length(titre) <= 300),
  date_publication timestamptz,
  duree_secondes integer CHECK (duree_secondes IS NULL OR duree_secondes >= 0),
  audio_url text NOT NULL CHECK (audio_url ~* '^https://'),
  image_url text CHECK (image_url IS NULL OR image_url ~* '^https://'),
  resume text CHECK (resume IS NULL OR char_length(resume) <= 300),
  lien text CHECK (lien IS NULL OR lien ~* '^https?://'),
  mis_a_jour timestamptz NOT NULL DEFAULT now(),
  UNIQUE (podcast_id, guid)
);
CREATE INDEX episodes_date_idx ON public.episodes (date_publication DESC);
GRANT SELECT ON public.episodes TO anon, authenticated;
GRANT ALL ON public.episodes TO service_role;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Episodes des membres a jour lisibles par tous" ON public.episodes
  FOR SELECT TO anon, authenticated USING (public.episodes_visibles(podcast_id));

-- État de lecture de chaque flux.
CREATE TABLE public.flux_etat (
  podcast_id uuid PRIMARY KEY REFERENCES public.podcasts(id) ON DELETE CASCADE,
  statut text NOT NULL CHECK (statut IN ('ok','erreur','introuvable')),
  message text,
  source text,
  nb_episodes integer NOT NULL DEFAULT 0,
  derniere_lecture timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flux_etat TO authenticated;
GRANT ALL ON public.flux_etat TO service_role;
ALTER TABLE public.flux_etat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins lisent l etat des flux" ON public.flux_etat
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.mes_flux()
RETURNS TABLE(podcast_id uuid, statut text, message text, nb_episodes integer, derniere_lecture timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.podcast_id, f.statut, f.message, f.nb_episodes, f.derniere_lecture
  FROM public.flux_etat f JOIN public.podcasts p ON p.id = f.podcast_id
  WHERE coalesce(auth.jwt() ->> 'email', '') <> '' AND lower(p.email) = lower(auth.jwt() ->> 'email')
$$;
REVOKE EXECUTE ON FUNCTION public.mes_flux() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mes_flux() TO authenticated;

-- Limite des vérifications de flux (20 par heure et par appareil) : fonction serveur seulement.
CREATE TABLE public.verifications_flux (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appareil text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX verifications_flux_idx ON public.verifications_flux (appareil, created_at);
GRANT ALL ON public.verifications_flux TO service_role;
ALTER TABLE public.verifications_flux ENABLE ROW LEVEL SECURITY;

-- Journal des lectures planifiées : une lecture complète au plus toutes les 5 h 30, quel que soit l'appelant.
CREATE TABLE public.sync_episodes_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  podcasts integer,
  episodes integer
);
GRANT ALL ON public.sync_episodes_runs TO service_role;
ALTER TABLE public.sync_episodes_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins lisent le journal des lectures" ON public.sync_episodes_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.sync_episodes_runs TO authenticated;

CREATE OR REPLACE FUNCTION public.demarrer_sync_episodes()
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE run_id bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(84211);
  IF EXISTS (SELECT 1 FROM public.sync_episodes_runs WHERE started_at > now() - interval '5 hours 30 minutes') THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.sync_episodes_runs DEFAULT VALUES RETURNING id INTO run_id;
  RETURN run_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.demarrer_sync_episodes() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.demarrer_sync_episodes() TO service_role;

-- Le lien du flux saisi ou modifié depuis le site doit être une adresse https.
CREATE OR REPLACE FUNCTION public.guard_podcasts_flux()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.flux_rss IS DISTINCT FROM OLD.flux_rss THEN
    NEW.flux_rss := public.pds_url(NEW.flux_rss, 'Flux RSS');
    IF NEW.flux_rss IS NOT NULL AND NEW.flux_rss !~* '^https://' THEN
      RAISE EXCEPTION 'Le lien du flux RSS doit commencer par https://' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_01_guard_podcasts_flux ON public.podcasts;
CREATE TRIGGER trg_01_guard_podcasts_flux BEFORE INSERT OR UPDATE OF flux_rss ON public.podcasts
  FOR EACH ROW EXECUTE FUNCTION public.guard_podcasts_flux();