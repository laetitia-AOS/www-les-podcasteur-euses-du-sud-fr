-- Vérification des règles des abonné·es de L'Onde du Sud, avec des adresses fictives (@exemple.invalid).
-- Tout s'exécute dans un seul bloc qui se termine par une erreur volontaire : rien n'est conservé en base.
-- Résultat attendu : « ONDE_ABONNES_OK ». Toute autre erreur indique une règle cassée.
DO $$
DECLARE
  j uuid;
  n int;
  s text;
  ok boolean;
BEGIN
  -- Personne ne lit ni n'écrit la table en direct
  IF has_table_privilege('anon', 'public.onde_abonnes', 'SELECT') OR has_table_privilege('authenticated', 'public.onde_abonnes', 'SELECT')
     OR has_table_privilege('anon', 'public.onde_abonnes', 'INSERT') OR has_table_privilege('authenticated', 'public.onde_abonnes', 'INSERT') THEN
    RAISE EXCEPTION 'ECHEC : la table des abonnés est accessible en direct';
  END IF;
  IF has_function_privilege('anon', 'public.onde_abonnes_liste()', 'EXECUTE') OR has_function_privilege('anon', 'public.onde_destinataires()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.onde_destinataires()', 'EXECUTE') THEN
    RAISE EXCEPTION 'ECHEC : un visiteur peut appeler la liste';
  END IF;

  -- Consentement obligatoire, e-mail vérifié
  ok := false;
  BEGIN PERFORM public.onde_inscrire('Test', 'onde-ab-1@exemple.invalid', false, 'onde'); EXCEPTION WHEN OTHERS THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : inscription acceptée sans consentement'; END IF;
  ok := false;
  BEGIN PERFORM public.onde_inscrire('Test', 'pas-une-adresse', true, 'onde'); EXCEPTION WHEN OTHERS THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : adresse invalide acceptée'; END IF;

  -- Inscription : en attente de confirmation, texte du consentement gardé
  PERFORM public.onde_inscrire('Test', 'onde-ab-1@exemple.invalid', true, 'onde');
  SELECT a.statut, a.jeton INTO s, j FROM public.onde_abonnes a WHERE a.email = 'onde-ab-1@exemple.invalid';
  IF s IS DISTINCT FROM 'en_attente' THEN RAISE EXCEPTION 'ECHEC : statut % au lieu de en_attente', s; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.onde_abonnes WHERE email = 'onde-ab-1@exemple.invalid' AND consentement_le IS NOT NULL
    AND consentement_texte = 'J''accepte de recevoir L''Onde du Sud par e-mail. Je peux me désinscrire à tout moment.') THEN
    RAISE EXCEPTION 'ECHEC : consentement non enregistré';
  END IF;

  -- Double inscription : une seule ligne, même en majuscules
  PERFORM public.onde_inscrire('Test', 'ONDE-AB-1@exemple.invalid', true, 'onde');
  SELECT count(*) INTO n FROM public.onde_abonnes WHERE lower(email) = 'onde-ab-1@exemple.invalid';
  IF n <> 1 THEN RAISE EXCEPTION 'ECHEC : double inscription crée % lignes', n; END IF;

  -- Anti-abus : 5 envois par heure et par adresse, le 6e est refusé
  PERFORM public.onde_inscrire('Test', 'onde-ab-1@exemple.invalid', true, 'onde');
  PERFORM public.onde_inscrire('Test', 'onde-ab-1@exemple.invalid', true, 'onde');
  PERFORM public.onde_inscrire('Test', 'onde-ab-1@exemple.invalid', true, 'onde');
  ok := false;
  BEGIN PERFORM public.onde_inscrire('Test', 'onde-ab-1@exemple.invalid', true, 'onde'); EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%5 envois%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : 6e envoi dans l''heure accepté'; END IF;

  -- Confirmation, désinscription, réinscription par le jeton
  IF public.onde_confirmer(j) <> 'actif' THEN RAISE EXCEPTION 'ECHEC : confirmation'; END IF;
  IF public.onde_desinscrire(j) <> 'desinscrit' THEN RAISE EXCEPTION 'ECHEC : désinscription'; END IF;
  IF public.onde_desinscrire(j) <> 'desinscrit' THEN RAISE EXCEPTION 'ECHEC : deuxième clic de désinscription'; END IF;
  IF public.onde_confirmer(j) <> 'desinscrit' THEN RAISE EXCEPTION 'ECHEC : un ancien lien de confirmation réabonne'; END IF;
  IF public.onde_reinscrire(j) <> 'actif' THEN RAISE EXCEPTION 'ECHEC : réinscription'; END IF;
  IF public.onde_desinscrire(gen_random_uuid()) <> 'introuvable' THEN RAISE EXCEPTION 'ECHEC : jeton inconnu accepté'; END IF;

  -- Destinataires : adhérent·e à jour inclus·e d'office, sauf désinscrit·e ; non-adhérent·e seulement si actif·ve
  INSERT INTO public.adhesions (email, prenom, nom, statut, date_adhesion, formule)
    VALUES ('onde-ab-adh@exemple.invalid', 'Test', 'Adherente', 'active', now(), 'personne');
  IF NOT EXISTS (SELECT 1 FROM public.onde_destinataires() d WHERE d.email = 'onde-ab-adh@exemple.invalid' AND d.origine = 'adhesion') THEN
    RAISE EXCEPTION 'ECHEC : adhérente à jour non incluse d''office';
  END IF;
  PERFORM public.onde_inscrire('Test', 'onde-ab-adh@exemple.invalid', true, 'evenement');
  SELECT a.jeton INTO j FROM public.onde_abonnes a WHERE a.email = 'onde-ab-adh@exemple.invalid';
  PERFORM public.onde_desinscrire(j);
  IF EXISTS (SELECT 1 FROM public.onde_destinataires() d WHERE d.email = 'onde-ab-adh@exemple.invalid') THEN
    RAISE EXCEPTION 'ECHEC : adhérente désinscrite encore incluse';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.onde_destinataires() d WHERE d.email = 'onde-ab-1@exemple.invalid' AND d.origine = 'abonnement') THEN
    RAISE EXCEPTION 'ECHEC : abonnée active absente';
  END IF;
  PERFORM public.onde_inscrire(NULL, 'onde-ab-2@exemple.invalid', true, 'evenement');
  IF EXISTS (SELECT 1 FROM public.onde_destinataires() d WHERE d.email = 'onde-ab-2@exemple.invalid') THEN
    RAISE EXCEPTION 'ECHEC : abonnée en attente déjà incluse';
  END IF;

  -- Un compte connecté qui n'est pas admin (membre ou éditeur·ice) ne lit pas la liste
  PERFORM set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated')::text, true);
  ok := false;
  BEGIN PERFORM * FROM public.onde_abonnes_liste(); EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un non-admin lit la liste'; END IF;
  ok := false;
  BEGIN PERFORM public.onde_abonnes_bilan(); EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un non-admin lit les chiffres'; END IF;
  ok := false;
  BEGIN PERFORM public.onde_supprimer_abonne(gen_random_uuid()); EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un non-admin supprime un abonné'; END IF;

  RAISE EXCEPTION 'ONDE_ABONNES_OK';
END $$;
