-- Codes des services studio
CREATE OR REPLACE FUNCTION public.pds_services_studio()
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['location','enregistrement_audio','video_podcast','montage','realisation','direct','studio_mobile']
$$;

-- 1. Fiches enrichies des studios et structures (une ligne par fiche, sans e-mail)
CREATE TABLE public.fiches_lieux (
  podcast_id uuid PRIMARY KEY REFERENCES public.podcasts(id) ON DELETE CASCADE,
  tarif_heure numeric(8,2) CHECK (tarif_heure IS NULL OR (tarif_heure >= 0 AND tarif_heure <= 10000)),
  capacite_voix integer CHECK (capacite_voix IS NULL OR capacite_voix BETWEEN 1 AND 50),
  acces_transports text CHECK (acces_transports IS NULL OR char_length(acces_transports) <= 200),
  services text[] NOT NULL DEFAULT '{}',
  photos text[] NOT NULL DEFAULT '{}',
  equipement jsonb NOT NULL DEFAULT '{}'::jsonb,
  accessibilite text CHECK (accessibilite IS NULL OR char_length(accessibilite) <= 300),
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  liens jsonb NOT NULL DEFAULT '[]'::jsonb,
  propositions jsonb NOT NULL DEFAULT '[]'::jsonb,
  presse jsonb NOT NULL DEFAULT '[]'::jsonb,
  podcasts_lies jsonb NOT NULL DEFAULT '[]'::jsonb,
  intitule_membres text NOT NULL DEFAULT 'accompagnes' CHECK (intitule_membres IN ('antenne','accompagnes')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fiches_lieux TO anon, authenticated;
GRANT INSERT, UPDATE ON public.fiches_lieux TO authenticated;
GRANT ALL ON public.fiches_lieux TO service_role;
ALTER TABLE public.fiches_lieux ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.lieu_visible(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.podcasts p WHERE p.id = _id AND p.valide AND p.type_profil IN ('studio','structure_eco'))
$$;
CREATE OR REPLACE FUNCTION public.mon_lieu(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(auth.jwt() ->> 'email', '') <> '' AND EXISTS (
    SELECT 1 FROM public.podcasts p WHERE p.id = _id AND p.type_profil IN ('studio','structure_eco')
      AND lower(p.email) = lower(auth.jwt() ->> 'email'))
$$;
REVOKE EXECUTE ON FUNCTION public.lieu_visible(uuid), public.mon_lieu(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.lieu_visible(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mon_lieu(uuid) TO authenticated, service_role;

CREATE POLICY "Fiches lieux visibles lisibles par tous" ON public.fiches_lieux FOR SELECT TO anon, authenticated
  USING (public.lieu_visible(podcast_id) OR public.mon_lieu(podcast_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Le lieu cree sa fiche" ON public.fiches_lieux FOR INSERT TO authenticated
  WITH CHECK (public.mon_lieu(podcast_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Le lieu modifie sa fiche" ON public.fiches_lieux FOR UPDATE TO authenticated
  USING (public.mon_lieu(podcast_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.mon_lieu(podcast_id) OR public.has_role(auth.uid(), 'admin'));

-- Contrôle et nettoyage serveur des fiches
CREATE OR REPLACE FUNCTION public.pds_jsonb_txt(v jsonb, maxlen int, label text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT public.pds_txt(CASE WHEN jsonb_typeof(v) = 'string' THEN v #>> '{}' ELSE NULL END, maxlen, label)
$$;

CREATE OR REPLACE FUNCTION public.guard_fiches_lieux()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  e jsonb; out jsonb; u text; d text;
BEGIN
  NEW.updated_at := now();
  NEW.acces_transports := public.pds_txt(NEW.acces_transports, 200, 'Accès');
  NEW.accessibilite := public.pds_txt(NEW.accessibilite, 300, 'Accessibilité');

  NEW.services := coalesce((SELECT array_agg(DISTINCT s ORDER BY s) FROM unnest(coalesce(NEW.services, '{}')) s), '{}');
  IF NOT (NEW.services <@ public.pds_services_studio()) THEN
    RAISE EXCEPTION 'Service inconnu.' USING ERRCODE = 'P0001';
  END IF;

  IF cardinality(NEW.photos) > 5 THEN RAISE EXCEPTION '5 photos au maximum.' USING ERRCODE = 'P0001'; END IF;
  NEW.photos := coalesce((SELECT array_agg(public.pds_url(x, 'Photo') ORDER BY i) FROM unnest(NEW.photos) WITH ORDINALITY t(x, i) WHERE coalesce(x, '') <> ''), '{}');

  -- Équipement
  IF jsonb_typeof(NEW.equipement) <> 'object' THEN NEW.equipement := '{}'::jsonb; END IF;
  NEW.equipement := jsonb_strip_nulls(jsonb_build_object(
    'micros', public.pds_jsonb_txt(NEW.equipement -> 'micros', 200, 'Micros'),
    'cameras', public.pds_jsonb_txt(NEW.equipement -> 'cameras', 200, 'Caméras'),
    'lumieres_decor', public.pds_jsonb_txt(NEW.equipement -> 'lumieres_decor', 200, 'Lumières et décor'),
    'technicien', CASE WHEN jsonb_typeof(NEW.equipement -> 'technicien') = 'boolean' THEN NEW.equipement -> 'technicien' END
  ));

  -- Questions fréquentes (3)
  IF jsonb_typeof(NEW.faq) <> 'array' OR jsonb_array_length(NEW.faq) > 3 THEN
    RAISE EXCEPTION '3 questions fréquentes au maximum.' USING ERRCODE = 'P0001';
  END IF;
  out := '[]'::jsonb;
  FOR e IN SELECT * FROM jsonb_array_elements(NEW.faq) LOOP
    IF public.pds_jsonb_txt(e -> 'q', 200, 'Question') IS NOT NULL THEN
      out := out || jsonb_build_object('q', public.pds_jsonb_txt(e -> 'q', 200, 'Question'), 'r', coalesce(public.pds_jsonb_txt(e -> 'r', 800, 'Réponse'), ''));
    END IF;
  END LOOP;
  NEW.faq := out;

  -- Liens (site, réseaux) : 6 au maximum, https
  IF jsonb_typeof(NEW.liens) <> 'array' OR jsonb_array_length(NEW.liens) > 6 THEN
    RAISE EXCEPTION '6 liens au maximum.' USING ERRCODE = 'P0001';
  END IF;
  out := '[]'::jsonb;
  FOR e IN SELECT * FROM jsonb_array_elements(NEW.liens) LOOP
    u := public.pds_url(CASE WHEN jsonb_typeof(e -> 'url') = 'string' THEN e ->> 'url' END, 'Lien');
    IF u IS NOT NULL THEN
      IF u !~* '^https://' THEN RAISE EXCEPTION 'Les liens doivent commencer par https://' USING ERRCODE = 'P0001'; END IF;
      out := out || jsonb_build_object('label', coalesce(public.pds_jsonb_txt(e -> 'label', 40, 'Nom du lien'), 'Lien'), 'url', u);
    END IF;
  END LOOP;
  NEW.liens := out;

  -- Ce que la structure propose (3)
  IF jsonb_typeof(NEW.propositions) <> 'array' OR jsonb_array_length(NEW.propositions) > 3 THEN
    RAISE EXCEPTION '3 propositions au maximum.' USING ERRCODE = 'P0001';
  END IF;
  out := '[]'::jsonb;
  FOR e IN SELECT * FROM jsonb_array_elements(NEW.propositions) LOOP
    IF public.pds_jsonb_txt(e -> 'titre', 80, 'Titre') IS NOT NULL THEN
      out := out || jsonb_build_object('titre', public.pds_jsonb_txt(e -> 'titre', 80, 'Titre'), 'texte', coalesce(public.pds_jsonb_txt(e -> 'texte', 400, 'Texte'), ''));
    END IF;
  END LOOP;
  NEW.propositions := out;

  -- Liens presse datés (10)
  IF jsonb_typeof(NEW.presse) <> 'array' OR jsonb_array_length(NEW.presse) > 10 THEN
    RAISE EXCEPTION '10 liens presse au maximum.' USING ERRCODE = 'P0001';
  END IF;
  out := '[]'::jsonb;
  FOR e IN SELECT * FROM jsonb_array_elements(NEW.presse) LOOP
    u := public.pds_url(CASE WHEN jsonb_typeof(e -> 'url') = 'string' THEN e ->> 'url' END, 'Lien presse');
    d := CASE WHEN jsonb_typeof(e -> 'date') = 'string' AND (e ->> 'date') ~ '^\d{4}-\d{2}(-\d{2})?$' THEN e ->> 'date' END;
    IF u IS NOT NULL THEN
      out := out || jsonb_strip_nulls(jsonb_build_object('titre', coalesce(public.pds_jsonb_txt(e -> 'titre', 150, 'Titre'), 'Article'), 'url', u, 'date', d));
    END IF;
  END LOOP;
  NEW.presse := out;

  -- Podcasts membres liés (12), uniquement des fiches visibles
  IF jsonb_typeof(NEW.podcasts_lies) <> 'array' OR jsonb_array_length(NEW.podcasts_lies) > 12 THEN
    RAISE EXCEPTION '12 podcasts liés au maximum.' USING ERRCODE = 'P0001';
  END IF;
  out := '[]'::jsonb;
  FOR e IN SELECT * FROM jsonb_array_elements(NEW.podcasts_lies) LOOP
    IF jsonb_typeof(e -> 'id') = 'string' AND (e ->> 'id') ~ '^[0-9a-f-]{36}$'
       AND EXISTS (SELECT 1 FROM public.podcasts p WHERE p.id = (e ->> 'id')::uuid AND p.valide AND p.id <> NEW.podcast_id) THEN
      d := CASE WHEN jsonb_typeof(e -> 'date') = 'string' AND (e ->> 'date') ~ '^\d{4}-\d{2}(-\d{2})?$' THEN e ->> 'date' END;
      out := out || jsonb_strip_nulls(jsonb_build_object('id', e ->> 'id', 'date', d,
        'url', public.pds_url(CASE WHEN jsonb_typeof(e -> 'url') = 'string' THEN e ->> 'url' END, 'Lien')));
    END IF;
  END LOOP;
  NEW.podcasts_lies := out;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_fiches_lieux BEFORE INSERT OR UPDATE ON public.fiches_lieux
  FOR EACH ROW EXECUTE FUNCTION public.guard_fiches_lieux();

-- Reprise des informations actuelles (rien n'est effacé dans les fiches)
INSERT INTO public.fiches_lieux (podcast_id, capacite_voix, acces_transports, services, photos, equipement, accessibilite, liens)
SELECT p.id,
  (SELECT least(50, greatest(1, (m[1])::int)) FROM regexp_match(coalesce(p.studio_data->>'capacite', ''), '(\d+)\s*(personnes en enregistrement|locut)') m),
  CASE WHEN p.studio_data->'accessibilite' ? 'Proche transports en commun' THEN 'Proche des transports en commun' END,
  coalesce((SELECT array_agg(DISTINCT c) FROM (
     SELECT CASE s
       WHEN 'Mise à disposition du studio' THEN 'location'
       WHEN 'Enregistrement audio' THEN 'enregistrement_audio'
       WHEN 'Enregistrement vidéo podcast' THEN 'video_podcast'
       WHEN 'Montage' THEN 'montage'
       WHEN 'Réalisation' THEN 'realisation' END c
     FROM jsonb_array_elements_text(coalesce(p.studio_data->'services_studio', '[]'::jsonb)) s
     UNION ALL SELECT 'direct' WHERE p.studio_data->'usages' ? 'Livestream'
     UNION ALL SELECT 'studio_mobile' WHERE p.studio_data->>'type_lieu' = 'Lieu d''enregistrement mobile'
   ) x WHERE c IS NOT NULL), '{}'),
  coalesce((SELECT array_agg(u ORDER BY i) FROM jsonb_array_elements_text(coalesce(p.studio_data->'galerie_urls', '[]'::jsonb)) WITH ORDINALITY t(u, i) WHERE i <= 5), '{}'),
  jsonb_strip_nulls(jsonb_build_object(
    'micros', left(p.studio_data->>'precisions_materiel', 200),
    'technicien', CASE WHEN p.studio_data->>'accompagnement_technique' LIKE 'Oui%' THEN true WHEN p.studio_data ? 'accompagnement_technique' THEN false END)),
  left(nullif(p.studio_data->>'infos_acces', ''), 300),
  coalesce((SELECT jsonb_agg(jsonb_build_object('label', coalesce(nullif(l->>'type', 'Autre'), 'Site'), 'url', l->>'url'))
            FROM jsonb_array_elements(coalesce(p.studio_data->'liens_complementaires', '[]'::jsonb)) l
            WHERE l->>'url' ~* '^https://'), '[]'::jsonb)
FROM public.podcasts p
WHERE p.type_profil IN ('studio','structure_eco')
ON CONFLICT (podcast_id) DO NOTHING;

-- Année de la première adhésion valide d'un studio ou d'une structure (rien d'autre n'est renvoyé)
CREATE OR REPLACE FUNCTION public.annee_adhesion(_podcast_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT extract(year FROM min(a.date_adhesion))::int
  FROM public.podcasts p JOIN public.adhesions a ON lower(a.email) = lower(p.email) AND a.statut = 'active'
  WHERE p.id = _podcast_id AND p.valide AND p.type_profil IN ('studio','structure_eco')
$$;
REVOKE EXECUTE ON FUNCTION public.annee_adhesion(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.annee_adhesion(uuid) TO anon, authenticated;

-- Événements liés à une structure (rempli par les admins)
ALTER TABLE public.evenements ADD COLUMN IF NOT EXISTS structure_id uuid REFERENCES public.podcasts(id) ON DELETE SET NULL;
CREATE OR REPLACE FUNCTION public.guard_evenements_structure()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.structure_id IS DISTINCT FROM (CASE WHEN TG_OP = 'UPDATE' THEN OLD.structure_id END)
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.structure_id := CASE WHEN TG_OP = 'UPDATE' THEN OLD.structure_id END;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_evenements_structure BEFORE INSERT OR UPDATE OF structure_id ON public.evenements
  FOR EACH ROW EXECUTE FUNCTION public.guard_evenements_structure();

-- 2. Demandes de devis (une ligne par demande ; les studios la lisent dans leur boîte « Demandes reçues »)
CREATE TABLE public.demandes_devis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  email text NOT NULL,
  format text,
  periode text,
  departement text,
  besoins text[] NOT NULL DEFAULT '{}',
  description text NOT NULL,
  studio_vise uuid REFERENCES public.podcasts(id) ON DELETE SET NULL,
  nb_studios integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX demandes_devis_email_idx ON public.demandes_devis (lower(email), created_at);
GRANT SELECT ON public.demandes_devis TO authenticated;
GRANT ALL ON public.demandes_devis TO service_role;
ALTER TABLE public.demandes_devis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins lisent les demandes de devis" ON public.demandes_devis FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.guard_demandes_devis()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.nom := public.pds_txt(NEW.nom, 100, 'Nom', true);
  NEW.email := public.pds_email(NEW.email);
  NEW.format := public.pds_txt(NEW.format, 80, 'Format');
  NEW.periode := public.pds_txt(NEW.periode, 80, 'Période');
  NEW.departement := public.pds_txt(NEW.departement, 3, 'Département');
  NEW.description := public.pds_txt(NEW.description, 2000, 'Description du projet', true);
  NEW.besoins := coalesce((SELECT array_agg(DISTINCT s ORDER BY s) FROM unnest(coalesce(NEW.besoins, '{}')) s), '{}');
  IF NOT (NEW.besoins <@ public.pds_services_studio()) THEN
    RAISE EXCEPTION 'Besoin inconnu.' USING ERRCODE = 'P0001';
  END IF;
  NEW.created_at := now();
  IF (SELECT count(*) FROM public.demandes_devis d WHERE lower(d.email) = NEW.email AND d.created_at > now() - interval '24 hours') >= 3 THEN
    RAISE EXCEPTION 'Vous avez envoyé 3 demandes de devis aujourd''hui avec cette adresse. Réessayez demain.' USING ERRCODE = 'P0001', HINT = 'rate_limit';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_demandes_devis BEFORE INSERT ON public.demandes_devis
  FOR EACH ROW EXECUTE FUNCTION public.guard_demandes_devis();

ALTER TABLE public.contact_requests ADD COLUMN IF NOT EXISTS devis_id uuid REFERENCES public.demandes_devis(id) ON DELETE CASCADE;

-- Messages aux studios et structures : 3 par jour et par adresse ; collabs 5 par jour ; autres 5 par heure.
CREATE OR REPLACE FUNCTION public.guard_contact_requests()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lieu boolean;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  NEW.type := coalesce(NEW.type, 'message');
  NEW.sender_name := public.pds_txt(NEW.sender_name, 100, 'Nom', true);
  NEW.sender_email := public.pds_email(NEW.sender_email);
  NEW.message := public.pds_txt(NEW.message, CASE WHEN NEW.type = 'collab' THEN 1000 ELSE 5000 END, 'Message', true);
  NEW.status := 'pending';
  NEW.lu_le := NULL;
  NEW.created_at := now();
  SELECT p.type_profil IN ('studio','structure_eco') INTO lieu FROM public.podcasts p WHERE p.id = NEW.recipient_id;
  IF NEW.type = 'devis' THEN
    -- La limite des devis (3 par jour) est appliquée sur la demande elle-même
    IF NEW.devis_id IS NULL THEN RAISE EXCEPTION 'Demande de devis incomplète.' USING ERRCODE = 'P0001'; END IF;
  ELSIF NEW.type = 'collab' THEN
    IF (SELECT count(DISTINCT c.created_at) FROM public.contact_requests c
        WHERE c.type = 'collab' AND lower(c.sender_email) = NEW.sender_email AND c.created_at > now() - interval '24 hours') >= 5 THEN
      RAISE EXCEPTION 'Vous avez envoyé 5 propositions de collab aujourd''hui avec cette adresse. Réessayez demain.' USING ERRCODE = 'P0001', HINT = 'rate_limit';
    END IF;
  ELSIF coalesce(lieu, false) THEN
    IF (SELECT count(DISTINCT c.created_at) FROM public.contact_requests c JOIN public.podcasts p ON p.id = c.recipient_id
        WHERE c.type = 'message' AND p.type_profil IN ('studio','structure_eco')
          AND lower(c.sender_email) = NEW.sender_email AND c.created_at > now() - interval '24 hours') >= 3 THEN
      RAISE EXCEPTION 'Vous avez envoyé 3 messages aux studios et structures aujourd''hui avec cette adresse. Réessayez demain.' USING ERRCODE = 'P0001', HINT = 'rate_limit';
    END IF;
  ELSIF (SELECT count(DISTINCT c.created_at) FROM public.contact_requests c
      WHERE c.type = 'message' AND lower(c.sender_email) = NEW.sender_email AND c.created_at > now() - interval '1 hour') >= 5 THEN
    PERFORM public.pds_trop_d_envois();
  END IF;
  RETURN NEW;
END $$;

-- Boîte « Demandes reçues » : les devis apportent leurs détails (format, période, département, besoins)
DROP FUNCTION IF EXISTS public.mes_demandes();
CREATE FUNCTION public.mes_demandes()
RETURNS TABLE(id uuid, recipient_id uuid, sender_name text, sender_email text, message text, created_at timestamptz, type text, lu_le timestamptz,
              devis_format text, devis_periode text, devis_departement text, devis_besoins text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.recipient_id, c.sender_name, c.sender_email, c.message, c.created_at, c.type, c.lu_le,
         d.format, d.periode, d.departement, d.besoins
  FROM public.contact_requests c
  LEFT JOIN public.demandes_devis d ON d.id = c.devis_id
  WHERE coalesce(auth.jwt() ->> 'email', '') <> ''
    AND c.created_at >= timestamptz '2026-10-28 00:00:00 Europe/Paris'
    AND c.recipient_id IN (SELECT p.id FROM public.podcasts p WHERE lower(p.email) = lower(auth.jwt() ->> 'email'))
  ORDER BY c.created_at DESC
  LIMIT 100
$$;
REVOKE EXECUTE ON FUNCTION public.mes_demandes() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mes_demandes() TO authenticated;