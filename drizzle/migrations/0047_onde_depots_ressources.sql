-- L'Onde du Sud : nouveau type de dépôt « Une ressource à partager » (lien obligatoire, son facultatif)
-- et troisième case obligatoire « Mon dépôt n'est pas de l'autopromotion commerciale ».

ALTER TABLE public.onde_depots ADD COLUMN sans_autopromo boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.onde_depots.sans_autopromo IS 'Case « Mon dépôt n''est pas de l''autopromotion commerciale », cochée par le membre (obligatoire pour déposer ou modifier).';

ALTER TABLE public.onde_depots DROP CONSTRAINT onde_depots_type_check;
ALTER TABLE public.onde_depots ADD CONSTRAINT onde_depots_type_check
  CHECK (type IN ('son', 'ecoute', 'projet', 'coulisses', 'appel', 'ressource'));

CREATE OR REPLACE FUNCTION public.onde_etiquette_depot(_type text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public'
AS $$
  SELECT CASE _type
    WHEN 'son' THEN 'À l''écoute'
    WHEN 'ecoute' THEN 'Une écoute recommandée'
    WHEN 'projet' THEN 'En fabrication'
    WHEN 'coulisses' THEN 'Les coulisses'
    WHEN 'appel' THEN 'Dans notre agenda'
    WHEN 'ressource' THEN 'Ressources partagées'
    ELSE 'Déposé par un·e membre' END
$$;

CREATE OR REPLACE FUNCTION public.guard_onde_depots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base text := '^https://[a-z0-9-]+\.supabase\.co/functions/v1/onde-media/depots/' || NEW.id::text || '/[A-Za-z0-9_-]+\.';
  nb integer;
  debut_mois timestamptz := date_trunc('month', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris';
  contenu_change boolean;
BEGIN
  NEW.email := public.pds_email(NEW.email, true);
  IF NEW.type IS NULL OR NEW.type NOT IN ('son', 'ecoute', 'projet', 'coulisses', 'appel', 'ressource') THEN
    RAISE EXCEPTION 'Choisissez ce que vous déposez.' USING ERRCODE = 'P0001';
  END IF;
  NEW.titre := public.onde_txt(NEW.titre, 120, 'Titre', true);
  NEW.texte := public.onde_txt(NEW.texte, 500, 'Quelques lignes', true);
  NEW.lien_ecoute := public.pds_url(NEW.lien_ecoute, CASE WHEN NEW.type = 'ressource' THEN 'Lien de la ressource' ELSE 'Lien d''écoute' END, 500);
  NEW.audio_url := nullif(btrim(coalesce(NEW.audio_url, '')), '');
  NEW.photo_url := nullif(btrim(coalesce(NEW.photo_url, '')), '');
  IF NEW.audio_url IS NOT NULL AND NEW.audio_url !~ (base || 'mp3$') THEN
    RAISE EXCEPTION 'Le fichier MP3 doit être envoyé depuis le formulaire de dépôt.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.photo_url IS NOT NULL AND NEW.photo_url !~ (base || '(jpg|png|webp)$') THEN
    RAISE EXCEPTION 'La photo doit être envoyée depuis le formulaire de dépôt.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.type = 'ressource' THEN
    -- Une ressource : le lien est obligatoire, le son facultatif
    IF NEW.lien_ecoute IS NULL THEN
      RAISE EXCEPTION 'Ajoutez le lien de la ressource.' USING ERRCODE = 'P0001';
    END IF;
  ELSIF NEW.audio_url IS NULL AND NEW.lien_ecoute IS NULL THEN
    RAISE EXCEPTION 'Ajoutez le son : un fichier MP3 ou un lien d''écoute.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT coalesce(NEW.droits, false) OR NOT coalesce(NEW.accord_publication, false) THEN
    RAISE EXCEPTION 'Cochez les deux cases : vos droits sur ce son et votre accord pour la publication.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.statut IS NULL OR NEW.statut NOT IN ('nouveau', 'retenu', 'plus_tard', 'pas_retenu') THEN
    RAISE EXCEPTION 'Statut inconnu.' USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT public.membre_a_jour(NEW.email) THEN
      RAISE EXCEPTION 'Le dépôt pour L''Onde du Sud est réservé aux adhérent·es à jour.' USING ERRCODE = '42501';
    END IF;
    IF NOT coalesce(NEW.sans_autopromo, false) THEN
      RAISE EXCEPTION 'Cochez la case : votre dépôt n''est pas de l''autopromotion commerciale.' USING ERRCODE = 'P0001';
    END IF;
    NEW.podcast_id := (SELECT p.id FROM public.podcasts p
      WHERE lower(p.email) = NEW.email ORDER BY (p.type_profil = 'podcasteur'), p.created_at LIMIT 1);
    IF NEW.podcast_id IS NULL THEN
      RAISE EXCEPTION 'Créez d''abord votre profil dans l''espace membre.' USING ERRCODE = 'P0001';
    END IF;
    SELECT count(*) INTO nb FROM public.onde_depots d WHERE lower(d.email) = NEW.email AND d.created_at >= debut_mois;
    IF nb >= 10 THEN
      RAISE EXCEPTION 'Vous avez déjà fait 10 dépôts ce mois-ci : c''est le maximum. Rendez-vous le mois prochain.' USING ERRCODE = 'P0001', HINT = 'rate_limit';
    END IF;
    NEW.statut := 'nouveau';
    NEW.numero_id := NULL;
    NEW.notifie_le := NULL;
    NEW.created_at := now();
    NEW.consentement_le := now();
  ELSE
    NEW.email := OLD.email;
    NEW.created_at := OLD.created_at;
    IF NEW.podcast_id IS NOT NULL THEN NEW.podcast_id := OLD.podcast_id; END IF;
    contenu_change := (NEW.type, NEW.titre, NEW.texte, NEW.audio_url, NEW.lien_ecoute, NEW.photo_url)
      IS DISTINCT FROM (OLD.type, OLD.titre, OLD.texte, OLD.audio_url, OLD.lien_ecoute, OLD.photo_url);
    IF contenu_change THEN
      -- Un dépôt modifié par son auteur·ice : la troisième case est de nouveau obligatoire
      IF NOT coalesce(NEW.sans_autopromo, false) THEN
        RAISE EXCEPTION 'Cochez la case : votre dépôt n''est pas de l''autopromotion commerciale.' USING ERRCODE = 'P0001';
      END IF;
      NEW.consentement_le := now();
    ELSE
      NEW.sans_autopromo := coalesce(NEW.sans_autopromo, false) OR OLD.sans_autopromo;
      NEW.consentement_le := OLD.consentement_le;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_onde_depots() FROM PUBLIC, anon, authenticated;

-- « Déposé par » / « Partagé par » : le type du dépôt est ajouté pour choisir la mention
DROP FUNCTION public.onde_credits_depots(uuid);
CREATE FUNCTION public.onde_credits_depots(_numero_id uuid)
RETURNS TABLE(depot_id uuid, prenom text, nom text, fiche_id uuid, slug text, type_profil text, nom_podcast text, type text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
#variable_conflict use_column
DECLARE st text; bl jsonb;
BEGIN
  SELECT o.statut, o.blocs INTO st, bl FROM public.onde_numeros o WHERE o.id = _numero_id;
  IF st IS NULL THEN RETURN; END IF;
  IF st <> 'publie' AND NOT public.peut_editer_onde() THEN RETURN; END IF;
  RETURN QUERY
  SELECT d.id, p.prenom, p.nom,
    CASE WHEN public.podcast_visible(p.id) THEN p.id END,
    CASE WHEN public.podcast_visible(p.id) THEN p.slug END,
    CASE WHEN public.podcast_visible(p.id) THEN p.type_profil END,
    CASE WHEN public.podcast_visible(p.id) THEN p.nom_podcast END,
    d.type
  FROM public.onde_depots d
  JOIN public.podcasts p ON p.id = d.podcast_id
  WHERE d.id::text IN (SELECT x.value->>'depot_id' FROM jsonb_array_elements(coalesce(bl, '[]'::jsonb)) x WHERE x.value->>'type' = 'depot');
END $$;
REVOKE ALL ON FUNCTION public.onde_credits_depots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.onde_credits_depots(uuid) TO anon, authenticated, service_role;