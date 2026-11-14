-- L'Onde du Sud, lot 4 : envoi par e-mail (Resend, appelé seulement par les fonctions serveur).
-- Les tables d'envoi ne sont lisibles par personne en direct : tout passe par les fonctions onde_envoi_*,
-- appelées par le serveur après vérification du rôle (admin ou éditeur·ice).

-- 1. Adhérent·es inclus·es d'office : une ligne « adherent » est créée au premier envoi, pour leur donner
--    un lien de désinscription personnel. Ce statut ne vaut que tant que l'adhésion est à jour.
ALTER TABLE public.onde_abonnes DROP CONSTRAINT onde_abonnes_statut_check;
ALTER TABLE public.onde_abonnes ADD CONSTRAINT onde_abonnes_statut_check CHECK (statut IN ('en_attente', 'actif', 'desinscrit', 'adherent'));
ALTER TABLE public.onde_abonnes ADD COLUMN confirmation_envoyee_le timestamptz;
COMMENT ON COLUMN public.onde_abonnes.statut IS 'en_attente = inscrit·e, pas encore confirmé·e ; actif = a confirmé ; desinscrit ; adherent = inclus·e par son adhésion (reçoit seulement tant que l''adhésion est à jour).';

-- 2. Durée de la version audio, pour le bouton « Écouter ce numéro (X min) »
ALTER TABLE public.onde_numeros ADD COLUMN audio_duree integer;

-- 3. Envois et journal
CREATE TABLE public.onde_envois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_id uuid NOT NULL REFERENCES public.onde_numeros(id) ON DELETE CASCADE,
  objet text NOT NULL,
  statut text NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'interrompu', 'termine')),
  message text,
  destinataires integer NOT NULL DEFAULT 0,
  lance_par uuid,
  demarre_le timestamptz NOT NULL DEFAULT now(),
  termine_le timestamptz,
  CONSTRAINT onde_envois_une_fois UNIQUE (numero_id)
);
COMMENT ON TABLE public.onde_envois IS 'Un envoi par numéro au maximum (contrainte onde_envois_une_fois).';

CREATE TABLE public.onde_envoi_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  envoi_id uuid NOT NULL REFERENCES public.onde_envois(id) ON DELETE CASCADE,
  email text NOT NULL,
  prenom text,
  jeton uuid,
  copie boolean NOT NULL DEFAULT false,
  statut text NOT NULL DEFAULT 'a_envoyer' CHECK (statut IN ('a_envoyer', 'en_cours', 'envoye', 'erreur')),
  erreur text,
  message_id text,
  tente_le timestamptz,
  envoye_le timestamptz,
  CONSTRAINT onde_envoi_journal_unique UNIQUE (envoi_id, email, copie),
  CONSTRAINT onde_envoi_journal_jeton CHECK (copie OR jeton IS NOT NULL)
);
CREATE INDEX onde_envoi_journal_statut ON public.onde_envoi_journal (envoi_id, statut);

-- Aucun accès direct pour les visiteur·ices ni les membres : seul le serveur (service_role) y touche.
REVOKE ALL ON public.onde_envois FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.onde_envoi_journal FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.onde_envois TO service_role;
GRANT ALL ON public.onde_envoi_journal TO service_role;
ALTER TABLE public.onde_envois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onde_envoi_journal ENABLE ROW LEVEL SECURITY;

-- Nombre de destinataires au moment présent (sans la copie à transférer)
CREATE OR REPLACE FUNCTION public.onde_destinataires_nombre()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT count(DISTINCT d.email)::int FROM public.onde_destinataires() d $$;

-- Démarre l'envoi d'un numéro publié : une seule fois. La liste est arrêtée ici, chaque personne avec son jeton.
CREATE OR REPLACE FUNCTION public.onde_envoi_demarrer(_numero_id uuid, _lance_par uuid, _objet text, _attendu integer, _copie text)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  st text;
  nb integer;
  eid uuid;
BEGIN
  SELECT o.statut INTO st FROM public.onde_numeros o WHERE o.id = _numero_id FOR UPDATE;
  IF st IS NULL THEN RAISE EXCEPTION 'Numéro introuvable.' USING ERRCODE = 'P0001'; END IF;
  IF st <> 'publie' THEN RAISE EXCEPTION 'Seul un numéro publié peut être envoyé.' USING ERRCODE = 'P0001'; END IF;
  IF EXISTS (SELECT 1 FROM public.onde_envois e WHERE e.numero_id = _numero_id) THEN
    RAISE EXCEPTION 'Ce numéro a déjà été envoyé : un numéro ne part qu''une fois.' USING ERRCODE = 'P0001';
  END IF;

  -- Adhérent·es sans ligne : création, pour leur lien de désinscription personnel
  INSERT INTO public.onde_abonnes (email, prenom, source, statut, consentement_texte)
  SELECT DISTINCT ON (d.email) d.email, nullif(btrim(d.prenom), ''), 'adhesion', 'adherent', 'Inclus·e d''office par son adhésion à l''association.'
  FROM public.onde_destinataires() d
  WHERE d.origine = 'adhesion' AND NOT EXISTS (SELECT 1 FROM public.onde_abonnes a WHERE lower(a.email) = d.email)
  ON CONFLICT DO NOTHING;

  nb := public.onde_destinataires_nombre();
  IF _attendu IS DISTINCT FROM nb THEN
    RAISE EXCEPTION 'La liste a changé depuis l''affichage : % destinataires maintenant. Vérifiez puis relancez.', nb USING ERRCODE = 'P0001', HINT = 'liste_changee';
  END IF;
  IF nb = 0 THEN RAISE EXCEPTION 'Aucun·e destinataire pour le moment.' USING ERRCODE = 'P0001'; END IF;

  INSERT INTO public.onde_envois (numero_id, objet, destinataires, lance_par)
  VALUES (_numero_id, left(coalesce(_objet, ''), 300), nb, _lance_par)
  RETURNING id INTO eid;

  INSERT INTO public.onde_envoi_journal (envoi_id, email, prenom, jeton, copie)
  SELECT DISTINCT ON (d.email) eid, d.email, nullif(btrim(d.prenom), ''), a.jeton, false
  FROM public.onde_destinataires() d
  JOIN public.onde_abonnes a ON lower(a.email) = d.email;

  IF coalesce(_copie, '') <> '' THEN
    INSERT INTO public.onde_envoi_journal (envoi_id, email, copie) VALUES (eid, lower(_copie), true);
  END IF;
  RETURN eid;
END $$;

-- Réserve le prochain lot à envoyer (une ligne restée « en cours » plus de 15 min est reprise).
CREATE OR REPLACE FUNCTION public.onde_envoi_reserver(_envoi_id uuid, _n integer)
RETURNS TABLE(id uuid, email text, prenom text, jeton uuid, copie boolean)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.onde_envois e SET statut = 'en_cours', message = NULL WHERE e.id = _envoi_id AND e.statut <> 'termine';
  IF NOT FOUND THEN RETURN; END IF;
  RETURN QUERY
  UPDATE public.onde_envoi_journal j SET statut = 'en_cours', tente_le = now()
  WHERE j.id IN (
    SELECT x.id FROM public.onde_envoi_journal x
    WHERE x.envoi_id = _envoi_id AND (x.statut = 'a_envoyer' OR (x.statut = 'en_cours' AND x.tente_le < now() - interval '15 minutes'))
    ORDER BY x.copie DESC, x.id
    LIMIT greatest(1, least(coalesce(_n, 50), 100))
    FOR UPDATE SKIP LOCKED
  )
  RETURNING j.id, j.email, j.prenom, j.jeton, j.copie;
END $$;

-- Résultat d'un lot : envoye (avec l'identifiant du message), erreur (avec le motif) ou a_envoyer (remis en file).
CREATE OR REPLACE FUNCTION public.onde_envoi_marquer(_ids uuid[], _message_ids text[], _statut text, _erreur text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF _statut NOT IN ('envoye', 'erreur', 'a_envoyer') THEN RAISE EXCEPTION 'Statut inconnu.'; END IF;
  UPDATE public.onde_envoi_journal j SET
    statut = _statut,
    message_id = CASE WHEN _statut = 'envoye' THEN left(m.mid, 100) ELSE j.message_id END,
    erreur = CASE WHEN _statut = 'erreur' THEN left(_erreur, 300) ELSE NULL END,
    envoye_le = CASE WHEN _statut = 'envoye' THEN now() ELSE j.envoye_le END
  FROM (SELECT u.i, u.mid FROM unnest(_ids, coalesce(_message_ids, ARRAY[]::text[])) AS u(i, mid)) m
  WHERE j.id = m.i AND m.i IS NOT NULL;
END $$;

-- Fin d'un passage : terminé s'il ne reste rien, sinon interrompu avec le motif (ex. limite du jour atteinte).
CREATE OR REPLACE FUNCTION public.onde_envoi_conclure(_envoi_id uuid, _message text)
RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE reste integer; s text;
BEGIN
  SELECT count(*) INTO reste FROM public.onde_envoi_journal j WHERE j.envoi_id = _envoi_id AND j.statut IN ('a_envoyer', 'en_cours');
  IF reste = 0 THEN
    UPDATE public.onde_envois SET statut = 'termine', termine_le = coalesce(termine_le, now()), message = NULL WHERE id = _envoi_id RETURNING statut INTO s;
  ELSE
    UPDATE public.onde_envois SET statut = 'interrompu', message = left(coalesce(_message, 'Envoi interrompu.'), 300) WHERE id = _envoi_id AND statut <> 'termine' RETURNING statut INTO s;
  END IF;
  RETURN s;
END $$;

-- Bilan d'un envoi pour l'admin. Les adresses en erreur ne sont renvoyées qu'avec _details (admins seulement, vérifié par le serveur).
CREATE OR REPLACE FUNCTION public.onde_envoi_bilan(_numero_id uuid, _details boolean)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT CASE WHEN e.id IS NULL THEN NULL ELSE jsonb_build_object(
    'id', e.id, 'statut', e.statut, 'message', e.message, 'objet', e.objet,
    'demarre_le', e.demarre_le, 'termine_le', e.termine_le, 'destinataires', e.destinataires,
    'envoyes', (SELECT count(*) FROM public.onde_envoi_journal j WHERE j.envoi_id = e.id AND NOT j.copie AND j.statut = 'envoye'),
    'erreurs', (SELECT count(*) FROM public.onde_envoi_journal j WHERE j.envoi_id = e.id AND NOT j.copie AND j.statut = 'erreur'),
    'restants', (SELECT count(*) FROM public.onde_envoi_journal j WHERE j.envoi_id = e.id AND NOT j.copie AND j.statut IN ('a_envoyer', 'en_cours')),
    'copie', (SELECT j.statut FROM public.onde_envoi_journal j WHERE j.envoi_id = e.id AND j.copie LIMIT 1),
    'liste_erreurs', CASE WHEN _details THEN coalesce((
      SELECT jsonb_agg(jsonb_build_object('email', j.email, 'erreur', j.erreur, 'copie', j.copie) ORDER BY j.email)
      FROM public.onde_envoi_journal j WHERE j.envoi_id = e.id AND j.statut = 'erreur'), '[]'::jsonb) ELSE NULL END
  ) END
  FROM (SELECT 1) x LEFT JOIN public.onde_envois e ON e.numero_id = _numero_id
$$;

-- Liste des numéros déjà envoyés, pour la page « Tous les numéros » (admins et éditeur·ices).
CREATE OR REPLACE FUNCTION public.onde_envois_resume()
RETURNS TABLE(numero_id uuid, statut text, demarre_le timestamptz, termine_le timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT e.numero_id, e.statut, e.demarre_le, e.termine_le FROM public.onde_envois e WHERE public.peut_editer_onde()
$$;

-- E-mail de confirmation : au plus un toutes les 10 minutes pour une même adresse en attente.
CREATE OR REPLACE FUNCTION public.onde_confirmation_a_envoyer(_email text)
RETURNS TABLE(jeton uuid, prenom text)
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$
  UPDATE public.onde_abonnes a SET confirmation_envoyee_le = now()
  WHERE lower(a.email) = lower(btrim(coalesce(_email, ''))) AND a.statut = 'en_attente'
    AND (a.confirmation_envoyee_le IS NULL OR a.confirmation_envoyee_le < now() - interval '10 minutes')
  RETURNING a.jeton, a.prenom
$$;

-- Effacement d'un·e abonné·e (sur demande, ou avec les données d'un·e membre) : ses traces dans le journal partent aussi.
CREATE OR REPLACE FUNCTION public.onde_abonne_efface()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.onde_envoi_journal WHERE lower(email) = lower(OLD.email) AND NOT copie;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.onde_abonne_efface() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER onde_abonne_efface AFTER DELETE ON public.onde_abonnes FOR EACH ROW EXECUTE FUNCTION public.onde_abonne_efface();

-- Les adhérent·es inclus·es d'office ne sont pas des abonné·es « en attente » dans les chiffres
CREATE OR REPLACE FUNCTION public.onde_abonnes_bilan()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE res jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Réservé aux admins.' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'adherents_office', (SELECT count(*) FROM public.onde_destinataires() d WHERE d.origine = 'adhesion'),
    'destinataires', (SELECT count(*) FROM public.onde_destinataires()),
    'actifs', count(*) FILTER (WHERE a.statut = 'actif'),
    'en_attente', count(*) FILTER (WHERE a.statut = 'en_attente'),
    'desinscrits', count(*) FILTER (WHERE a.statut = 'desinscrit')
  ) INTO res
  FROM public.onde_abonnes a;
  RETURN res;
END $$;

-- Inscription : désormais appelée par la fonction serveur « onde-inscription », qui envoie aussi l'e-mail de confirmation.
REVOKE ALL ON FUNCTION public.onde_inscrire(text, text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.onde_inscrire(text, text, boolean, text) TO service_role;

REVOKE ALL ON FUNCTION public.onde_destinataires_nombre() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.onde_envoi_demarrer(uuid, uuid, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.onde_envoi_reserver(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.onde_envoi_marquer(uuid[], text[], text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.onde_envoi_conclure(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.onde_envoi_bilan(uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.onde_confirmation_a_envoyer(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.onde_envois_resume() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onde_destinataires_nombre() TO service_role;
GRANT EXECUTE ON FUNCTION public.onde_envoi_demarrer(uuid, uuid, text, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.onde_envoi_reserver(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.onde_envoi_marquer(uuid[], text[], text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.onde_envoi_conclure(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.onde_envoi_bilan(uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.onde_confirmation_a_envoyer(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.onde_envois_resume() TO authenticated, service_role;

-- Vérification des numéros : durée audio et résumé pour l'e-mail en plus (le reste est inchangé)
CREATE OR REPLACE FUNCTION public.guard_onde_numeros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  publier boolean;
  propre jsonb := '[]'::jsonb;
  el jsonb;
  ancien jsonb;
  i integer := 0;
  noms text[] := ARRAY['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
BEGIN
  IF NEW.statut IS NULL OR NEW.statut NOT IN ('brouillon', 'publie') THEN
    RAISE EXCEPTION 'Statut inconnu.' USING ERRCODE = 'P0001';
  END IF;
  publier := NEW.statut = 'publie';

  IF NEW.numero IS NULL OR NEW.numero < 1 OR NEW.numero > 9999 THEN
    RAISE EXCEPTION 'Le numéro doit être un nombre entier, à partir de 1.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.mois IS NULL THEN
    RAISE EXCEPTION 'Choisissez le mois du numéro.' USING ERRCODE = 'P0001';
  END IF;
  NEW.mois := date_trunc('month', NEW.mois)::date;

  NEW.titre := coalesce(public.onde_txt(NEW.titre, 120, 'Titre', publier), '');
  NEW.chapeau := coalesce(public.onde_txt(NEW.chapeau, 240, 'Chapeau', publier), '');
  NEW.couverture_url := public.onde_fichier(NEW.couverture_url, 'Photo de couverture', publier);
  NEW.couverture_alt := public.onde_txt(NEW.couverture_alt, 250, 'Texte alternatif de la couverture', publier);
  NEW.audio_url := public.onde_fichier(NEW.audio_url, 'Version audio', false);
  NEW.audio_voix := public.onde_txt(NEW.audio_voix, 80, 'Voix du mois', publier AND NEW.audio_url IS NOT NULL);
  -- Durée de la version audio (en secondes), lue par l'éditeur ; effacée avec le MP3
  IF NEW.audio_url IS NULL OR NEW.audio_duree IS NULL OR NEW.audio_duree < 1 OR NEW.audio_duree > 36000 THEN
    NEW.audio_duree := NULL;
  END IF;

  IF NEW.blocs IS NULL THEN NEW.blocs := '[]'::jsonb; END IF;
  IF jsonb_typeof(NEW.blocs) <> 'array' THEN
    RAISE EXCEPTION 'Les blocs sont mal formés.' USING ERRCODE = 'P0001';
  END IF;
  IF jsonb_array_length(NEW.blocs) > 30 THEN
    RAISE EXCEPTION 'Un numéro contient 30 blocs au maximum.' USING ERRCODE = 'P0001';
  END IF;
  FOR el IN SELECT value FROM jsonb_array_elements(NEW.blocs) LOOP
    i := i + 1;
    -- Lot 4 : résumé facultatif pour l'e-mail (texte simple, 300 caractères)
    ancien := el;
    el := public.onde_bloc_propre(el, publier, i);
    IF public.onde_txt(ancien->>'resume', 300, 'Résumé pour l''e-mail du bloc ' || i, false) IS NOT NULL THEN
      el := el || jsonb_build_object('resume', public.onde_txt(ancien->>'resume', 300, 'Résumé pour l''e-mail du bloc ' || i, false));
    END IF;
    IF el->>'type' = 'nouveaux_membres' THEN
      ancien := NULL;
      IF TG_OP = 'UPDATE' THEN
        SELECT x.value INTO ancien FROM jsonb_array_elements(OLD.blocs) x
          WHERE x.value->>'id' = el->>'id' AND x.value->>'type' = 'nouveaux_membres' LIMIT 1;
      END IF;
      IF ancien IS NOT NULL AND jsonb_typeof(ancien->'membres') = 'array' AND ancien->>'mois' IS NOT DISTINCT FROM el->>'mois' THEN
        el := el || jsonb_build_object('membres', ancien->'membres');
      ELSIF publier AND el->>'mois' IS NOT NULL THEN
        el := el || jsonb_build_object('membres', coalesce(
          (SELECT jsonb_agg(c.podcast_id ORDER BY lower(c.nom)) FROM public.onde_membres_calcul((el->>'mois')::date, NEW.id) c WHERE c.complet AND NOT c.deja),
          '[]'::jsonb));
      END IF;
    END IF;
    propre := propre || jsonb_build_array(el);
  END LOOP;
  NEW.blocs := propre;

  IF TG_OP = 'INSERT' THEN
    NEW.auteur_id := auth.uid();
    NEW.created_at := now();
    NEW.publie_le := CASE WHEN publier THEN now() ELSE NULL END;
  ELSE
    NEW.auteur_id := OLD.auteur_id;
    NEW.created_at := OLD.created_at;
    -- Date de première publication, gardée si le numéro est dépublié puis republié
    NEW.publie_le := coalesce(OLD.publie_le, CASE WHEN publier THEN now() ELSE NULL END);
  END IF;

  -- Adresse du numéro (/onde/n1-decembre-2026) : fixée à la première publication, pour ne casser aucun lien partagé.
  IF TG_OP = 'INSERT' OR OLD.publie_le IS NULL THEN
    NEW.slug := 'n' || NEW.numero || '-' || noms[extract(month FROM NEW.mois)::int] || '-' || extract(year FROM NEW.mois)::int;
  ELSE
    NEW.slug := OLD.slug;
  END IF;

  NEW.modifie_par := auth.uid();
  NEW.updated_at := now();
  RETURN NEW;
END
$function$;
