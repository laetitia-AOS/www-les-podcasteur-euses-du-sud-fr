-- Vérification des règles d'envoi de L'Onde du Sud (lot 4), avec des adresses fictives (@exemple.invalid).
-- Aucun e-mail ne part : on teste seulement la base. Le bloc se termine par une erreur volontaire : rien n'est conservé.
-- Résultat attendu : « ONDE_ENVOI_OK ». Toute autre erreur indique une règle cassée.
DO $$
DECLARE
  num uuid := gen_random_uuid();
  brouillon uuid := gen_random_uuid();
  e uuid;
  j uuid;
  nb int;
  ok boolean;
  img text := 'https://pnxbuhtqiruayzykaagw.supabase.co/functions/v1/onde-media/' || gen_random_uuid() || '/couverture.jpg';
BEGIN
  -- Personne d'autre que le serveur ne touche aux envois
  IF has_table_privilege('anon', 'public.onde_envois', 'SELECT') OR has_table_privilege('authenticated', 'public.onde_envois', 'SELECT')
     OR has_table_privilege('authenticated', 'public.onde_envois', 'INSERT') OR has_table_privilege('anon', 'public.onde_envoi_journal', 'SELECT')
     OR has_table_privilege('authenticated', 'public.onde_envoi_journal', 'SELECT') THEN
    RAISE EXCEPTION 'ECHEC : les envois sont lisibles en direct';
  END IF;
  IF has_function_privilege('authenticated', 'public.onde_envoi_demarrer(uuid, uuid, text, integer, text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.onde_envoi_demarrer(uuid, uuid, text, integer, text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.onde_envoi_reserver(uuid, integer)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.onde_envoi_bilan(uuid, boolean)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.onde_inscrire(text, text, boolean, text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.onde_destinataires_nombre()', 'EXECUTE') THEN
    RAISE EXCEPTION 'ECHEC : un visiteur ou un membre peut déclencher un envoi';
  END IF;

  -- Abonné·es fictif·ves : une active, une en attente, une désinscrite
  INSERT INTO public.onde_abonnes (email, prenom, source, statut, consentement_le, consentement_texte) VALUES
    ('onde-env-actif@exemple.invalid', 'Actif', 'onde', 'actif', now(), 'test'),
    ('onde-env-attente@exemple.invalid', 'Attente', 'onde', 'en_attente', now(), 'test'),
    ('onde-env-desinscrit@exemple.invalid', 'Desinscrit', 'onde', 'desinscrit', now(), 'test');
  -- Une adhérente fictive à jour, sans inscription : incluse d'office
  INSERT INTO public.adhesions (email, prenom, nom, statut, date_adhesion, formule)
    VALUES ('onde-env-adh@exemple.invalid', 'Test', 'Adherente', 'active', now(), 'personne');

  INSERT INTO public.onde_numeros (id, numero, mois, slug, titre, chapeau, couverture_url, couverture_alt, statut)
    VALUES (num, 9991, '2030-01-01', 'x', 'Numéro test', 'Chapeau test', img, 'Photo test', 'publie');
  INSERT INTO public.onde_numeros (id, numero, mois, slug, statut) VALUES (brouillon, 9992, '2030-02-01', 'y', 'brouillon');

  -- Un brouillon ne part pas
  ok := false;
  BEGIN PERFORM public.onde_envoi_demarrer(brouillon, NULL, 'x', 1, 'copie@exemple.invalid'); EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%publié%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un brouillon peut partir'; END IF;

  -- Nombre affiché différent du nombre réel : refus, avec le bon motif
  nb := public.onde_destinataires_nombre();
  ok := false;
  BEGIN PERFORM public.onde_envoi_demarrer(num, NULL, 'x', nb + 1, 'copie@exemple.invalid'); EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%liste a changé%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : envoi lancé avec un nombre de destinataires périmé'; END IF;

  e := public.onde_envoi_demarrer(num, NULL, 'Numéro test — L''Onde du Sud n°9991', nb, 'copie@exemple.invalid');

  -- Liste arrêtée : active et adhérente incluses, en attente et désinscrite exclues, chacun·e avec son jeton
  IF NOT EXISTS (SELECT 1 FROM public.onde_envoi_journal WHERE envoi_id = e AND email = 'onde-env-actif@exemple.invalid' AND jeton IS NOT NULL AND NOT copie) THEN
    RAISE EXCEPTION 'ECHEC : abonnée active absente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.onde_envoi_journal WHERE envoi_id = e AND email = 'onde-env-adh@exemple.invalid' AND jeton IS NOT NULL) THEN
    RAISE EXCEPTION 'ECHEC : adhérente à jour absente';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.onde_abonnes WHERE email = 'onde-env-adh@exemple.invalid' AND statut = 'adherent') THEN
    RAISE EXCEPTION 'ECHEC : adhérente sans lien de désinscription personnel';
  END IF;
  IF EXISTS (SELECT 1 FROM public.onde_envoi_journal WHERE envoi_id = e AND email IN ('onde-env-attente@exemple.invalid', 'onde-env-desinscrit@exemple.invalid')) THEN
    RAISE EXCEPTION 'ECHEC : une personne en attente ou désinscrite est dans la liste';
  END IF;
  IF (SELECT count(*) FROM public.onde_envoi_journal WHERE envoi_id = e AND NOT copie) <> nb THEN
    RAISE EXCEPTION 'ECHEC : la liste ne correspond pas au nombre annoncé';
  END IF;
  -- La copie à transférer : une seule ligne, sans jeton (donc sans lien de désinscription personnel)
  IF (SELECT count(*) FROM public.onde_envoi_journal WHERE envoi_id = e AND copie AND email = 'copie@exemple.invalid' AND jeton IS NULL) <> 1 THEN
    RAISE EXCEPTION 'ECHEC : copie à transférer absente ou avec un jeton';
  END IF;

  -- Un numéro ne part qu'une fois
  ok := false;
  BEGIN PERFORM public.onde_envoi_demarrer(num, NULL, 'x', nb, 'copie@exemple.invalid'); EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%déjà été envoyé%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un numéro peut partir deux fois'; END IF;

  -- Lots : la copie passe d'abord ; tout envoyé = terminé
  IF NOT (SELECT r.copie FROM public.onde_envoi_reserver(e, 1) r LIMIT 1) THEN RAISE EXCEPTION 'ECHEC : la copie ne part pas en premier'; END IF;
  PERFORM public.onde_envoi_marquer(ARRAY(SELECT id FROM public.onde_envoi_journal WHERE envoi_id = e), NULL, 'envoye', NULL);
  IF public.onde_envoi_conclure(e, NULL) <> 'termine' THEN RAISE EXCEPTION 'ECHEC : envoi complet non terminé'; END IF;
  IF EXISTS (SELECT 1 FROM public.onde_envoi_reserver(e, 50)) THEN RAISE EXCEPTION 'ECHEC : un envoi terminé repart'; END IF;
  IF (public.onde_envoi_bilan(num, false)->>'envoyes')::int <> nb OR public.onde_envoi_bilan(num, false)->'liste_erreurs' <> 'null'::jsonb THEN
    RAISE EXCEPTION 'ECHEC : bilan faux, ou adresses montrées sans droit';
  END IF;

  -- Désinscription par le lien personnel : exclue du prochain envoi
  SELECT a.jeton INTO j FROM public.onde_abonnes a WHERE a.email = 'onde-env-adh@exemple.invalid';
  IF public.onde_desinscrire(j) <> 'desinscrit' THEN RAISE EXCEPTION 'ECHEC : désinscription'; END IF;
  IF EXISTS (SELECT 1 FROM public.onde_destinataires() d WHERE d.email = 'onde-env-adh@exemple.invalid') THEN
    RAISE EXCEPTION 'ECHEC : adhérente désinscrite encore destinataire';
  END IF;

  -- Effacement sur demande : les traces du journal partent avec l'abonnement
  DELETE FROM public.onde_abonnes WHERE email = 'onde-env-actif@exemple.invalid';
  IF EXISTS (SELECT 1 FROM public.onde_envoi_journal WHERE email = 'onde-env-actif@exemple.invalid') THEN
    RAISE EXCEPTION 'ECHEC : le journal garde une adresse effacée';
  END IF;

  -- Résumé pour l'e-mail : gardé et nettoyé ; durée audio effacée sans MP3
  UPDATE public.onde_numeros SET blocs = '[{"id":"b1","type":"texte","rubrique":"R","texte":"T","resume":"<b>Court</b> résumé"}]'::jsonb, audio_duree = 600 WHERE id = num;
  IF (SELECT blocs->0->>'resume' FROM public.onde_numeros WHERE id = num) <> 'Court résumé' THEN RAISE EXCEPTION 'ECHEC : résumé non nettoyé'; END IF;
  IF (SELECT audio_duree FROM public.onde_numeros WHERE id = num) IS NOT NULL THEN RAISE EXCEPTION 'ECHEC : durée gardée sans MP3'; END IF;

  -- Un compte connecté non éditeur ne voit pas la liste des numéros envoyés
  PERFORM set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated')::text, true);
  IF EXISTS (SELECT 1 FROM public.onde_envois_resume()) THEN RAISE EXCEPTION 'ECHEC : un non-éditeur voit les envois'; END IF;

  RAISE EXCEPTION 'ONDE_ENVOI_OK';
END $$;
