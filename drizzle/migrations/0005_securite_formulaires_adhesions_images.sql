-- 1. Adhésions : plus aucune écriture publique. Seuls la confirmation HelloAsso (serveur) et les admins écrivent.
DROP POLICY IF EXISTS "Webhook can insert adhesions" ON public.adhesions;
REVOKE INSERT, UPDATE, DELETE ON public.adhesions FROM anon;

-- Messages aux membres et devis : uniquement via la fonction serveur, qui vérifie le destinataire.
DROP POLICY IF EXISTS "Anyone can submit a contact request" ON public.contact_requests;
REVOKE INSERT ON public.contact_requests FROM anon;

-- 2. Outils de vérification des champs
CREATE OR REPLACE FUNCTION public.pds_txt(v text, maxlen int, label text, required boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE s text;
BEGIN
  IF v IS NOT NULL THEN
    s := regexp_replace(v, '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');
    s := btrim(s, E' \t\r\n');
    IF s = '' THEN s := NULL; END IF;
  END IF;
  IF s IS NULL AND required THEN
    RAISE EXCEPTION 'Le champ « % » est obligatoire.', label USING ERRCODE = 'P0001';
  END IF;
  IF s IS NOT NULL AND char_length(s) > maxlen THEN
    RAISE EXCEPTION 'Le champ « % » est trop long (% caractères au maximum).', label, maxlen USING ERRCODE = 'P0001';
  END IF;
  RETURN s;
END $$;

CREATE OR REPLACE FUNCTION public.pds_email(v text, required boolean DEFAULT true)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE s text := lower(public.pds_txt(v, 255, 'E-mail', required));
BEGIN
  IF s IS NOT NULL AND s !~ '^[^\s@()<>,;]+@[^\s@()<>,;]+\.[^\s@()<>,;]{2,}$' THEN
    RAISE EXCEPTION 'Adresse e-mail invalide.' USING ERRCODE = 'P0001';
  END IF;
  RETURN s;
END $$;

CREATE OR REPLACE FUNCTION public.pds_url(v text, label text, maxlen int DEFAULT 500)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE s text := public.pds_txt(v, maxlen, label, false);
BEGIN
  IF s IS NOT NULL AND s !~* '^https?://[^\s<>"]+$' THEN
    RAISE EXCEPTION 'Le lien « % » doit commencer par https://', label USING ERRCODE = 'P0001';
  END IF;
  RETURN s;
END $$;

CREATE OR REPLACE FUNCTION public.pds_tel(v text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE s text := public.pds_txt(v, 30, 'Téléphone', false);
BEGIN
  IF s IS NOT NULL AND s !~ '^[0-9+(). -]{6,30}$' THEN
    RAISE EXCEPTION 'Numéro de téléphone invalide.' USING ERRCODE = 'P0001';
  END IF;
  RETURN s;
END $$;

CREATE OR REPLACE FUNCTION public.pds_trop_d_envois()
RETURNS void LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RAISE EXCEPTION 'Vous avez fait 5 envois dans l''heure avec cette adresse. Réessayez un peu plus tard.' USING ERRCODE = 'P0001', HINT = 'rate_limit';
END $$;

-- 3. Contact général
CREATE OR REPLACE FUNCTION public.guard_contacts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  NEW.profil := public.pds_txt(NEW.profil, 80, 'Profil', true);
  NEW.objet := public.pds_txt(NEW.objet, 150, 'Objet', true);
  NEW.message := public.pds_txt(NEW.message, 5000, 'Message', true);
  NEW.prenom := public.pds_txt(NEW.prenom, 100, 'Prénom', true);
  NEW.nom := public.pds_txt(NEW.nom, 100, 'Nom', true);
  NEW.structure := public.pds_txt(NEW.structure, 150, 'Structure');
  NEW.email := public.pds_email(NEW.email);
  NEW.statut := 'Nouveau';
  NEW.created_at := now();
  IF (SELECT count(DISTINCT c.created_at) FROM public.contacts c
      WHERE lower(c.email) = NEW.email AND c.created_at > now() - interval '1 hour') >= 5 THEN
    PERFORM public.pds_trop_d_envois();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_00_guard_contacts ON public.contacts;
CREATE TRIGGER trg_00_guard_contacts BEFORE INSERT ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.guard_contacts();

-- 4. Messages aux membres et devis (un envoi = une seule insertion, même pour plusieurs studios)
CREATE OR REPLACE FUNCTION public.guard_contact_requests()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  NEW.sender_name := public.pds_txt(NEW.sender_name, 100, 'Nom', true);
  NEW.sender_email := public.pds_email(NEW.sender_email);
  NEW.message := public.pds_txt(NEW.message, 5000, 'Message', true);
  NEW.status := 'pending';
  NEW.created_at := now();
  IF (SELECT count(DISTINCT c.created_at) FROM public.contact_requests c
      WHERE lower(c.sender_email) = NEW.sender_email AND c.created_at > now() - interval '1 hour') >= 5 THEN
    PERFORM public.pds_trop_d_envois();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_00_guard_contact_requests ON public.contact_requests;
CREATE TRIGGER trg_00_guard_contact_requests BEFORE INSERT ON public.contact_requests FOR EACH ROW EXECUTE FUNCTION public.guard_contact_requests();

-- 5. Inscriptions aux événements
CREATE OR REPLACE FUNCTION public.guard_evenement_inscriptions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  NEW.prenom := public.pds_txt(NEW.prenom, 100, 'Prénom', true);
  NEW.nom := public.pds_txt(NEW.nom, 100, 'Nom', true);
  NEW.email := public.pds_email(NEW.email);
  NEW.telephone := public.pds_tel(NEW.telephone);
  NEW.structure := public.pds_txt(NEW.structure, 150, 'Structure');
  NEW.statut := 'confirmee';
  NEW.created_at := now();
  IF NOT EXISTS (SELECT 1 FROM public.evenements e WHERE e.id = NEW.evenement_id
                 AND e.publie AND e.inscription_activee
                 AND coalesce(e.date_fin, e.date_debut) > now()) THEN
    RAISE EXCEPTION 'Les inscriptions ne sont pas ouvertes pour cet événement.' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(DISTINCT i.created_at) FROM public.evenement_inscriptions i
      WHERE lower(i.email) = NEW.email AND i.created_at > now() - interval '1 hour') >= 5 THEN
    PERFORM public.pds_trop_d_envois();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_00_guard_inscriptions ON public.evenement_inscriptions;
CREATE TRIGGER trg_00_guard_inscriptions BEFORE INSERT ON public.evenement_inscriptions FOR EACH ROW EXECUTE FUNCTION public.guard_evenement_inscriptions();

-- 6. Événements proposés : toujours en attente de relecture
CREATE OR REPLACE FUNCTION public.guard_evenements()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE mail text;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  NEW.publie := false;
  NEW.inscription_activee := false;
  NEW.podcasts_invites := '[]'::jsonb;
  NEW.created_at := now();
  NEW.titre := public.pds_txt(NEW.titre, 150, 'Titre', true);
  NEW.sous_titre := public.pds_txt(NEW.sous_titre, 200, 'Sous-titre');
  NEW.description := public.pds_txt(NEW.description, 6000, 'Description');
  NEW.lieu := public.pds_txt(NEW.lieu, 200, 'Lieu');
  NEW.adresse := public.pds_txt(NEW.adresse, 250, 'Adresse');
  NEW.type := coalesce(public.pds_txt(NEW.type, 50, 'Type'), 'rencontre');
  NEW.lien_externe := public.pds_url(NEW.lien_externe, 'Lien');
  NEW.image_url := public.pds_url(NEW.image_url, 'Image');
  IF NEW.places IS NOT NULL AND (NEW.places < 1 OR NEW.places > 100000) THEN
    RAISE EXCEPTION 'Nombre de places invalide.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.date_debut < now() - interval '1 day' OR NEW.date_debut > now() + interval '3 years' THEN
    RAISE EXCEPTION 'Date de début invalide.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.date_fin IS NOT NULL AND NEW.date_fin < NEW.date_debut THEN
    RAISE EXCEPTION 'La date de fin doit suivre la date de début.' USING ERRCODE = 'P0001';
  END IF;
  mail := lower(substring(coalesce(NEW.description, '') FROM '\(([^()\s]+@[^()\s]+)\)\s*$'));
  PERFORM public.pds_email(mail);
  IF (SELECT count(DISTINCT e.created_at) FROM public.evenements e
      WHERE position('(' || mail || ')' IN lower(coalesce(e.description, ''))) > 0
        AND e.created_at > now() - interval '1 hour') >= 5 THEN
    PERFORM public.pds_trop_d_envois();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_00_guard_evenements ON public.evenements;
CREATE TRIGGER trg_00_guard_evenements BEFORE INSERT ON public.evenements FOR EACH ROW EXECUTE FUNCTION public.guard_evenements();

-- 7. Fiches et podcasts (inscription)
CREATE OR REPLACE FUNCTION public.guard_podcasts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  NEW.created_at := now();
  NEW.email := public.pds_email(NEW.email);
  NEW.nom_podcast := coalesce(public.pds_txt(NEW.nom_podcast, 150, 'Nom'), '');
  NEW.description := coalesce(public.pds_txt(NEW.description, 5000, 'Description'), '');
  NEW.lien_ecoute := coalesce(public.pds_txt(NEW.lien_ecoute, 500, 'Lien d''écoute'), '');
  NEW.thematique := public.pds_txt(NEW.thematique, 100, 'Thématique');
  NEW.ville := public.pds_txt(NEW.ville, 100, 'Ville');
  NEW.type_podcast := public.pds_txt(NEW.type_podcast, 100, 'Type');
  NEW.monetise := public.pds_txt(NEW.monetise, 100, 'Monétisation');
  NEW.besoin := public.pds_txt(NEW.besoin, 500, 'Besoin');
  NEW.prenom := public.pds_txt(NEW.prenom, 100, 'Prénom');
  NEW.nom := public.pds_txt(NEW.nom, 100, 'Nom');
  NEW.structure := public.pds_txt(NEW.structure, 150, 'Structure');
  NEW.telephone := public.pds_tel(NEW.telephone);
  NEW.department_code := public.pds_txt(NEW.department_code, 5, 'Département');
  NEW.department_label := public.pds_txt(NEW.department_label, 100, 'Département');
  NEW.city_name := public.pds_txt(NEW.city_name, 100, 'Ville');
  NEW.city_insee_code := public.pds_txt(NEW.city_insee_code, 10, 'Ville');
  NEW.city_postcode := public.pds_txt(NEW.city_postcode, 10, 'Code postal');
  NEW.niveau_avancement := public.pds_txt(NEW.niveau_avancement, 50, 'Avancement');
  NEW.frequence_publication := public.pds_txt(NEW.frequence_publication, 50, 'Fréquence');
  NEW.priorite_actuelle := public.pds_txt(NEW.priorite_actuelle, 300, 'Priorité');
  NEW.bio_750 := public.pds_txt(NEW.bio_750, 1000, 'Présentation');
  NEW.metier_principal := public.pds_txt(NEW.metier_principal, 150, 'Métier');
  NEW.disponibilite := public.pds_txt(NEW.disponibilite, 100, 'Disponibilité');
  NEW.format_collaboration := public.pds_txt(NEW.format_collaboration, 200, 'Collaboration');
  NEW.vignette_url := public.pds_url(NEW.vignette_url, 'Image');
  NEW.photo_profil_url := public.pds_url(NEW.photo_profil_url, 'Photo');
  NEW.lien_principal := public.pds_url(NEW.lien_principal, 'Site');
  NEW.lien_linkedin := public.pds_url(NEW.lien_linkedin, 'LinkedIn');
  NEW.flux_rss := public.pds_url(NEW.flux_rss, 'Flux RSS');
  IF coalesce(array_length(NEW.besoins_podcast, 1), 0) > 10
     OR coalesce(array_length(NEW.services_3, 1), 0) > 10
     OR coalesce(array_length(NEW.cherche_collaboration, 1), 0) > 20
     OR coalesce(array_length(NEW.peut_apporter, 1), 0) > 20
     OR octet_length(coalesce(NEW.studio_data::text, '')) > 30000 THEN
    RAISE EXCEPTION 'Trop d''éléments envoyés.' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(*) FROM public.podcasts p WHERE lower(p.email) = NEW.email AND p.created_at = now()) >= 10 THEN
    RAISE EXCEPTION 'Trop de fiches envoyées en une fois.' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(DISTINCT p.created_at) FROM public.podcasts p
      WHERE lower(p.email) = NEW.email AND p.created_at > now() - interval '1 hour'
        AND p.created_at <> now()) >= 5 THEN
    PERFORM public.pds_trop_d_envois();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_00_guard_podcasts ON public.podcasts;
CREATE TRIGGER trg_00_guard_podcasts BEFORE INSERT ON public.podcasts FOR EACH ROW EXECUTE FUNCTION public.guard_podcasts();

REVOKE EXECUTE ON FUNCTION public.guard_contacts(), public.guard_contact_requests(), public.guard_evenement_inscriptions(),
  public.guard_evenements(), public.guard_podcasts() FROM anon, authenticated, public;

-- 8. Images : personne ne peut lister les dossiers ; les admins gardent tout ; une personne connectée écrit dans son dossier.
DROP POLICY IF EXISTS "Podcast thumbnails are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read studio galleries" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete event images" ON storage.objects;

CREATE POLICY "Admins manage site images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('podcast-thumbnails','studio-galleries','event-images') AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id IN ('podcast-thumbnails','studio-galleries','event-images') AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members upload to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('podcast-thumbnails','studio-galleries','event-images') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Members read own folder" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('podcast-thumbnails','studio-galleries','event-images') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Members update own folder" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('podcast-thumbnails','studio-galleries','event-images') AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id IN ('podcast-thumbnails','studio-galleries','event-images') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Members delete own folder" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('podcast-thumbnails','studio-galleries','event-images') AND (storage.foldername(name))[1] = auth.uid()::text);
