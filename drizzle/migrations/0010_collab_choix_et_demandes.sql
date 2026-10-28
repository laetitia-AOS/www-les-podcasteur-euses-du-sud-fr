-- 1. Nouveaux choix « Je cherche » / « J'apporte » (les anciennes listes restent intactes)
ALTER TABLE public.podcasts
  ADD COLUMN IF NOT EXISTS cherche_choix text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS apporte_choix text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cherche_precision text,
  ADD COLUMN IF NOT EXISTS apporte_precision text;

CREATE OR REPLACE FUNCTION public.pds_collab_codes()
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['voix_off','montage','mixage','strategie','coproduction','etre_invite','recevoir_invites','sponsors','evenements','formation','studio','autre']
$$;

-- Conversion d'un ancien texte en nouveaux choix
CREATE OR REPLACE FUNCTION public.pds_collab_depuis_texte(t text)
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN t IN ('Faire de la voix off','Un·e voix off') THEN ARRAY['voix_off']
    WHEN t IN ('Proposer mes compétences techniques (son, montage)','Un·e monteur·euse / ingénieur son') THEN ARRAY['montage','mixage']
    WHEN t IN ('Partager mon expertise stratégique','Un·e expert·e en stratégie podcast') THEN ARRAY['strategie']
    WHEN t IN ('Co-produire un format','Un·e podcasteur·euse pour co-production','Co-production de contenus') THEN ARRAY['coproduction']
    WHEN t = 'Participer à un podcast en tant qu''invité·e' THEN ARRAY['etre_invite']
    WHEN t = 'Des invité·es pour mon podcast' THEN ARRAY['recevoir_invites']
    WHEN t IN ('Proposer un partenariat commercial','Des sponsors / partenaires commerciaux','Partenariats avec Les Podcasteur·euses du Sud') THEN ARRAY['sponsors']
    WHEN t IN ('Organiser ou co-organiser un événement','Un·e partenaire pour un événement','Accueil d''événements / rencontres') THEN ARRAY['evenements']
    WHEN t IN ('Mentorer un·e podcasteur·euse débutant·e','Un·e coach ou mentor·e') THEN ARRAY['formation']
    WHEN t IN ('Mettre à disposition un studio','Un·e studio d''enregistrement') THEN ARRAY['studio']
    WHEN t IN ('Créer des visuels / motion','Un·e graphiste / motion designer','Diffusion de podcasts locaux','Mise à disposition de ressources','Autre') THEN ARRAY['autre']
    ELSE ARRAY[]::text[]
  END
$$;

-- Reprise des fiches existantes : choix convertis + texte actuel recopié en entier dans la précision
UPDATE public.podcasts p SET
  cherche_choix = coalesce((SELECT array_agg(DISTINCT c ORDER BY c) FROM unnest(p.cherche_collaboration) t, unnest(public.pds_collab_depuis_texte(t)) c), '{}'),
  apporte_choix = coalesce((SELECT array_agg(DISTINCT c ORDER BY c) FROM unnest(p.peut_apporter) t, unnest(public.pds_collab_depuis_texte(t)) c), '{}'),
  cherche_precision = nullif(array_to_string(p.cherche_collaboration, ' · '), ''),
  apporte_precision = nullif(array_to_string(p.peut_apporter, ' · '), '')
WHERE coalesce(cardinality(p.cherche_collaboration), 0) > 0 OR coalesce(cardinality(p.peut_apporter), 0) > 0;

COMMENT ON COLUMN public.podcasts.cherche_collaboration IS 'DEPRECATED: replaced by cherche_choix + cherche_precision (kept intact as archive)';
COMMENT ON COLUMN public.podcasts.peut_apporter IS 'DEPRECATED: replaced by apporte_choix + apporte_precision (kept intact as archive)';

-- Contrôle serveur des choix et des précisions (insertion et modification)
CREATE OR REPLACE FUNCTION public.guard_podcasts_collab()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE codes text[] := public.pds_collab_codes();
BEGIN
  NEW.cherche_choix := coalesce((SELECT array_agg(DISTINCT c ORDER BY c) FROM unnest(coalesce(NEW.cherche_choix, '{}')) c), '{}');
  NEW.apporte_choix := coalesce((SELECT array_agg(DISTINCT c ORDER BY c) FROM unnest(coalesce(NEW.apporte_choix, '{}')) c), '{}');
  IF NOT (NEW.cherche_choix <@ codes) OR NOT (NEW.apporte_choix <@ codes) THEN
    RAISE EXCEPTION 'Choix « Je cherche » ou « J''apporte » inconnu.' USING ERRCODE = 'P0001';
  END IF;
  IF TG_OP = 'INSERT' OR NEW.cherche_precision IS DISTINCT FROM OLD.cherche_precision THEN
    NEW.cherche_precision := public.pds_txt(NEW.cherche_precision, 2000, 'Précision');
    IF char_length(coalesce(NEW.cherche_precision, '')) > 120
       AND (TG_OP = 'INSERT' OR char_length(coalesce(NEW.cherche_precision, '')) > char_length(coalesce(OLD.cherche_precision, ''))) THEN
      RAISE EXCEPTION 'La précision « Je cherche » fait 120 caractères au maximum.' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  IF TG_OP = 'INSERT' OR NEW.apporte_precision IS DISTINCT FROM OLD.apporte_precision THEN
    NEW.apporte_precision := public.pds_txt(NEW.apporte_precision, 2000, 'Précision');
    IF char_length(coalesce(NEW.apporte_precision, '')) > 120
       AND (TG_OP = 'INSERT' OR char_length(coalesce(NEW.apporte_precision, '')) > char_length(coalesce(OLD.apporte_precision, ''))) THEN
      RAISE EXCEPTION 'La précision « J''apporte » fait 120 caractères au maximum.' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_02_guard_podcasts_collab ON public.podcasts;
CREATE TRIGGER trg_02_guard_podcasts_collab BEFORE INSERT OR UPDATE OF cherche_choix, apporte_choix, cherche_precision, apporte_precision ON public.podcasts
  FOR EACH ROW EXECUTE FUNCTION public.guard_podcasts_collab();

-- 2. Demandes reçues : type et lecture
ALTER TABLE public.contact_requests
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'message',
  ADD COLUMN IF NOT EXISTS lu_le timestamptz;
UPDATE public.contact_requests SET type = 'devis' WHERE message LIKE 'Demande de devis%' AND type = 'message';
ALTER TABLE public.contact_requests DROP CONSTRAINT IF EXISTS contact_requests_type_check;
ALTER TABLE public.contact_requests ADD CONSTRAINT contact_requests_type_check CHECK (type IN ('message','devis','collab'));

CREATE OR REPLACE FUNCTION public.guard_contact_requests()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  NEW.type := coalesce(NEW.type, 'message');
  NEW.sender_name := public.pds_txt(NEW.sender_name, 100, 'Nom', true);
  NEW.sender_email := public.pds_email(NEW.sender_email);
  NEW.message := public.pds_txt(NEW.message, CASE WHEN NEW.type = 'collab' THEN 1000 ELSE 5000 END, 'Message', true);
  NEW.status := 'pending';
  NEW.lu_le := NULL;
  NEW.created_at := now();
  IF NEW.type = 'collab' THEN
    IF (SELECT count(DISTINCT c.created_at) FROM public.contact_requests c
        WHERE c.type = 'collab' AND lower(c.sender_email) = NEW.sender_email AND c.created_at > now() - interval '24 hours') >= 5 THEN
      RAISE EXCEPTION 'Vous avez envoyé 5 propositions de collab aujourd''hui avec cette adresse. Réessayez demain.' USING ERRCODE = 'P0001', HINT = 'rate_limit';
    END IF;
  ELSIF (SELECT count(DISTINCT c.created_at) FROM public.contact_requests c
      WHERE c.type <> 'collab' AND lower(c.sender_email) = NEW.sender_email AND c.created_at > now() - interval '1 hour') >= 5 THEN
    PERFORM public.pds_trop_d_envois();
  END IF;
  RETURN NEW;
END $$;

DROP FUNCTION IF EXISTS public.mes_demandes();
CREATE FUNCTION public.mes_demandes()
RETURNS TABLE(id uuid, recipient_id uuid, sender_name text, sender_email text, message text, created_at timestamptz, type text, lu_le timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.recipient_id, c.sender_name, c.sender_email, c.message, c.created_at, c.type, c.lu_le
  FROM public.contact_requests c
  WHERE coalesce(auth.jwt() ->> 'email', '') <> ''
    AND c.created_at >= timestamptz '2026-10-28 00:00:00 Europe/Paris'
    AND c.recipient_id IN (SELECT p.id FROM public.podcasts p WHERE lower(p.email) = lower(auth.jwt() ->> 'email'))
  ORDER BY c.created_at DESC
  LIMIT 100
$$;
REVOKE EXECUTE ON FUNCTION public.mes_demandes() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mes_demandes() TO authenticated;

-- Marquer comme lue : uniquement une demande reçue par le membre connecté
CREATE OR REPLACE FUNCTION public.marquer_demande_lue(_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF coalesce(auth.jwt() ->> 'email', '') = '' THEN RETURN false; END IF;
  UPDATE public.contact_requests c SET lu_le = now()
  WHERE c.id = _id AND c.lu_le IS NULL
    AND c.created_at >= timestamptz '2026-10-28 00:00:00 Europe/Paris'
    AND c.recipient_id IN (SELECT p.id FROM public.podcasts p WHERE lower(p.email) = lower(auth.jwt() ->> 'email'));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END $$;
REVOKE EXECUTE ON FUNCTION public.marquer_demande_lue(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.marquer_demande_lue(uuid) TO authenticated;