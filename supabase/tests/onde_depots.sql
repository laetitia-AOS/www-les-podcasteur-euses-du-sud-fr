-- Vérification des dépôts des membres pour L'Onde du Sud (lot 5), avec des comptes et adresses fictifs (@exemple.invalid).
-- Aucun e-mail ne part. Le bloc se termine par une erreur volontaire : rien n'est conservé.
-- Résultat attendu : « ONDE_DEPOTS_OK ». Toute autre erreur indique une règle cassée.
DO $$
DECLARE
  membre text := 'onde-depot-membre@exemple.invalid';
  autre text := 'onde-depot-autre@exemple.invalid';
  sans text := 'onde-depot-sans@exemple.invalid';
  editeur uuid := gen_random_uuid();
  fiche uuid;
  d1 uuid := gen_random_uuid();
  d2 uuid;
  d3 uuid;
  num uuid := gen_random_uuid();
  num2 uuid := gen_random_uuid();
  bid text;
  bl jsonb;
  ok boolean;
  avant int;
  i int;
  base text := 'https://pnxbuhtqiruayzykaagw.supabase.co/functions/v1/onde-media/';
BEGIN
  -- Aucun accès direct à la table ni aux fonctions du serveur
  IF has_table_privilege('anon', 'public.onde_depots', 'SELECT') OR has_table_privilege('authenticated', 'public.onde_depots', 'SELECT')
     OR has_table_privilege('authenticated', 'public.onde_depots', 'INSERT') OR has_table_privilege('authenticated', 'public.onde_depots', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.onde_depots', 'DELETE') THEN
    RAISE EXCEPTION 'ECHEC : les dépôts sont lisibles ou modifiables en direct';
  END IF;
  IF has_function_privilege('anon', 'public.mes_depots_onde()', 'EXECUTE') OR has_function_privilege('anon', 'public.onde_depots_equipe()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.onde_depot_publie(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.onde_depots_a_notifier(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.onde_utiliser_depot(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ECHEC : un visiteur ou un membre peut appeler une fonction réservée';
  END IF;

  avant := public.onde_depots_ce_mois();

  -- Profils fictifs : deux adhérent·es à jour, une personne sans adhésion
  INSERT INTO public.podcasts (nom_podcast, lien_ecoute, description, email, prenom, nom, type_profil)
    VALUES ('—', 'https://exemple.invalid', 'Profil fictif', membre, 'camille', 'testeuse', 'pro_podcast') RETURNING id INTO fiche;
  INSERT INTO public.podcasts (nom_podcast, lien_ecoute, description, email, prenom, nom, type_profil) VALUES
    ('—', 'https://exemple.invalid', 'Profil fictif', autre, 'Alex', 'Autre', 'pro_podcast'),
    ('—', 'https://exemple.invalid', 'Profil fictif', sans, 'Sam', 'Sans', 'pro_podcast');
  INSERT INTO public.adhesions (email, prenom, nom, statut, date_adhesion, formule) VALUES
    (membre, 'Camille', 'Testeuse', 'active', now(), 'personne'),
    (autre, 'Alex', 'Autre', 'active', now(), 'personne');

  -- Un non-adhérent ne peut pas déposer
  ok := false;
  BEGIN
    INSERT INTO public.onde_depots (email, type, titre, texte, lien_ecoute, droits, accord_publication)
      VALUES (sans, 'son', 'T', 'X', 'https://exemple.invalid/a', true, true);
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%réservé aux adhérent%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un non-adhérent peut déposer'; END IF;

  -- Les deux cases sont obligatoires, le son aussi
  ok := false;
  BEGIN INSERT INTO public.onde_depots (email, type, titre, texte, lien_ecoute, droits, accord_publication) VALUES (membre, 'son', 'T', 'X', 'https://exemple.invalid/a', false, true);
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%Cochez les deux cases%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : dépôt sans la case des droits'; END IF;
  ok := false;
  BEGIN INSERT INTO public.onde_depots (email, type, titre, texte, lien_ecoute, droits, accord_publication) VALUES (membre, 'son', 'T', 'X', 'https://exemple.invalid/a', true, false);
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%Cochez les deux cases%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : dépôt sans l''accord de publication'; END IF;
  ok := false;
  BEGIN INSERT INTO public.onde_depots (email, type, titre, texte, droits, accord_publication) VALUES (membre, 'son', 'T', 'X', true, true);
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%Ajoutez le son%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : dépôt sans son'; END IF;
  -- Un fichier qui ne vient pas du dossier de ce dépôt est refusé
  ok := false;
  BEGIN INSERT INTO public.onde_depots (email, type, titre, texte, audio_url, droits, accord_publication)
    VALUES (membre, 'son', 'T', 'X', base || 'depots/' || gen_random_uuid() || '/a.mp3', true, true);
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%formulaire de dépôt%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : fichier d''un autre dossier accepté'; END IF;

  -- Dépôt valide : texte nettoyé, statut « Nouveau », relié à la fiche du profil
  INSERT INTO public.onde_depots (id, email, type, titre, texte, audio_url, photo_url, droits, accord_publication, statut)
    VALUES (d1, membre, 'son', '<b>Le port</b> à l''aube', 'Un micro <script>x</script>posé sur le quai.', base || 'depots/' || d1 || '/a.mp3', base || 'depots/' || d1 || '/p.jpg', true, true, 'retenu');
  IF (SELECT titre FROM public.onde_depots WHERE id = d1) <> 'Le port à l''aube' OR (SELECT texte FROM public.onde_depots WHERE id = d1) LIKE '%<script>%' THEN
    RAISE EXCEPTION 'ECHEC : texte non nettoyé';
  END IF;
  IF (SELECT statut FROM public.onde_depots WHERE id = d1) <> 'nouveau' OR (SELECT podcast_id FROM public.onde_depots WHERE id = d1) <> fiche THEN
    RAISE EXCEPTION 'ECHEC : statut ou fiche forcés par l''envoi';
  END IF;
  INSERT INTO public.onde_depots (email, type, titre, texte, lien_ecoute, droits, accord_publication)
    VALUES (autre, 'ecoute', 'Une écoute', 'Texte', 'https://exemple.invalid/b', true, true) RETURNING id INTO d2;

  -- Un membre ne voit que ses propres dépôts, ni la liste de l'équipe, ni les fichiers des autres
  PERFORM set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated', 'email', autre)::text, true);
  IF EXISTS (SELECT 1 FROM public.mes_depots_onde() WHERE id = d1) OR NOT EXISTS (SELECT 1 FROM public.mes_depots_onde() WHERE id = d2) THEN
    RAISE EXCEPTION 'ECHEC : un membre voit les dépôts des autres (ou pas les siens)';
  END IF;
  IF EXISTS (SELECT 1 FROM public.onde_depots_equipe()) THEN RAISE EXCEPTION 'ECHEC : un membre voit la liste de l''équipe'; END IF;
  IF public.mon_depot_onde(d1::text) OR NOT public.mon_depot_onde(d2::text) THEN RAISE EXCEPTION 'ECHEC : accès aux fichiers des dépôts'; END IF;
  ok := false;
  BEGIN PERFORM public.onde_depot_statut(d1, 'pas_retenu'); EXCEPTION WHEN OTHERS THEN ok := SQLSTATE = '42501'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un membre change le statut d''un dépôt'; END IF;
  IF NOT public.peut_deposer_onde() THEN RAISE EXCEPTION 'ECHEC : adhérent·e à jour refusé·e'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated', 'email', sans)::text, true);
  IF public.peut_deposer_onde() THEN RAISE EXCEPTION 'ECHEC : un non-adhérent voit le formulaire'; END IF;

  -- 10 dépôts par mois au maximum
  FOR i IN 2..10 LOOP
    INSERT INTO public.onde_depots (email, type, titre, texte, lien_ecoute, droits, accord_publication)
      VALUES (membre, 'projet', 'Dépôt ' || i, 'Texte', 'https://exemple.invalid/c', true, true);
  END LOOP;
  ok := false;
  BEGIN INSERT INTO public.onde_depots (email, type, titre, texte, lien_ecoute, droits, accord_publication) VALUES (membre, 'projet', 'Onzième', 'T', 'https://exemple.invalid/c', true, true);
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%10 dépôts ce mois-ci%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : plus de 10 dépôts dans le mois'; END IF;

  -- Compteur de l'admin et encart : le même nombre, celui des dépôts du mois
  IF public.onde_depots_ce_mois() <> avant + 11 THEN RAISE EXCEPTION 'ECHEC : compteur du mois faux (% au lieu de %)', public.onde_depots_ce_mois(), avant + 11; END IF;

  -- « Utiliser dans un numéro » (éditeur·ice fictif·ve) : bloc rempli, relié au dépôt, dépôt « Retenu »
  INSERT INTO auth.users (id, email, aud, role) VALUES (editeur, 'onde-depot-editeur@exemple.invalid', 'authenticated', 'authenticated');
  INSERT INTO public.user_roles (user_id, role) VALUES (editeur, 'editeur');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', editeur::text, 'role', 'authenticated', 'email', 'onde-depot-editeur@exemple.invalid')::text, true);
  INSERT INTO public.onde_numeros (id, numero, mois, slug, statut) VALUES (num, 9993, '2031-01-01', 'z', 'brouillon');
  INSERT INTO public.onde_numeros (id, numero, mois, slug, statut) VALUES (num2, 9994, '2031-02-01', 'z2', 'brouillon');
  bid := public.onde_utiliser_depot(d1, num);
  SELECT x.value INTO bl FROM public.onde_numeros o CROSS JOIN LATERAL jsonb_array_elements(o.blocs) x WHERE o.id = num AND x.value->>'id' = bid;
  IF bl IS NULL OR bl->>'type' <> 'depot' OR bl->>'depot_id' <> d1::text OR bl->>'rubrique' <> 'À l''écoute' OR bl->>'titre' <> 'Le port à l''aube'
     OR bl->>'url' IS NULL OR bl->'photo'->>'url' IS NULL THEN
    RAISE EXCEPTION 'ECHEC : bloc mal rempli : %', bl;
  END IF;
  IF (SELECT statut FROM public.onde_depots WHERE id = d1) <> 'retenu' OR (SELECT numero_id FROM public.onde_depots WHERE id = d1) <> num THEN
    RAISE EXCEPTION 'ECHEC : dépôt utilisé pas « Retenu »';
  END IF;
  IF (SELECT c.prenom FROM public.onde_credits_depots(num) c WHERE c.depot_id = d1) <> 'camille' THEN RAISE EXCEPTION 'ECHEC : « Déposé par » absent pour l''équipe'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.onde_depots_equipe() WHERE id = d1) THEN RAISE EXCEPTION 'ECHEC : l''équipe ne voit pas les dépôts'; END IF;
  ok := false;
  BEGIN PERFORM public.onde_utiliser_depot(d1, num); EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%déjà dans ce numéro%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un dépôt ajouté deux fois au même numéro'; END IF;

  -- Brouillon : un visiteur ne voit ni le nom ni le fichier
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  IF EXISTS (SELECT 1 FROM public.onde_credits_depots(num)) THEN RAISE EXCEPTION 'ECHEC : « Déposé par » d''un brouillon visible par un visiteur'; END IF;
  IF EXISTS (SELECT 1 FROM public.onde_depot_publie(d1)) THEN RAISE EXCEPTION 'ECHEC : fichier lisible avant publication'; END IF;

  -- Publication : texte alternatif de la photo exigé, puis dépôt publié (fichiers servis, nom visible)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', editeur::text, 'role', 'authenticated')::text, true);
  ok := false;
  BEGIN
    UPDATE public.onde_numeros SET titre = 'Test', chapeau = 'Chapeau', couverture_url = base || num || '/c.jpg', couverture_alt = 'Photo', statut = 'publie' WHERE id = num;
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%Texte alternatif de la photo%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : photo du dépôt publiée sans texte alternatif'; END IF;
  UPDATE public.onde_numeros SET titre = 'Test', chapeau = 'Chapeau', couverture_url = base || num || '/c.jpg', couverture_alt = 'Photo',
    blocs = jsonb_set(blocs, '{0,photo,alt}', '"Un quai au lever du jour"'), statut = 'publie' WHERE id = num;
  IF NOT EXISTS (SELECT 1 FROM public.onde_depot_publie(d1)) THEN RAISE EXCEPTION 'ECHEC : dépôt publié non reconnu'; END IF;
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  IF NOT EXISTS (SELECT 1 FROM public.onde_credits_depots(num) WHERE depot_id = d1) THEN RAISE EXCEPTION 'ECHEC : « Déposé par » absent sur le numéro publié'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated', 'email', membre)::text, true);
  IF (SELECT publie_mois FROM public.mes_depots_onde() WHERE id = d1) <> '2031-01-01' THEN RAISE EXCEPTION 'ECHEC : « Publié dans L''Onde de [mois] » absent'; END IF;

  -- Retour au déposant : seulement après l'envoi du numéro, une seule fois
  IF EXISTS (SELECT 1 FROM public.onde_depots_a_notifier(num)) THEN RAISE EXCEPTION 'ECHEC : déposant prévenu avant l''envoi'; END IF;
  INSERT INTO public.onde_envois (numero_id, objet) VALUES (num, 'Test');
  IF NOT EXISTS (SELECT 1 FROM public.onde_depots_a_notifier(num) WHERE id = d1) THEN RAISE EXCEPTION 'ECHEC : déposant pas prévenu à l''envoi'; END IF;
  PERFORM public.onde_depot_notifie(d1);
  IF EXISTS (SELECT 1 FROM public.onde_depots_a_notifier(num)) THEN RAISE EXCEPTION 'ECHEC : déposant prévenu deux fois'; END IF;

  -- Un dépôt retiré par son auteur·ice bloque la publication du bloc qui le reprend
  PERFORM set_config('request.jwt.claims', json_build_object('sub', editeur::text, 'role', 'authenticated')::text, true);
  SELECT d.id INTO d3 FROM public.onde_depots d WHERE d.email = membre AND d.id <> d1 LIMIT 1;
  PERFORM public.onde_utiliser_depot(d3, num2);
  DELETE FROM public.onde_depots WHERE id = d3;
  ok := false;
  BEGIN
    UPDATE public.onde_numeros SET titre = 'Test 2', chapeau = 'Chapeau', couverture_url = base || num2 || '/c.jpg', couverture_alt = 'Photo', statut = 'publie' WHERE id = num2;
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%retiré par son auteur%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : bloc d''un dépôt retiré publié'; END IF;

  -- Suppression des données à la demande du membre : ses dépôts partent aussi
  PERFORM public.effacer_donnees_membre(membre);
  IF EXISTS (SELECT 1 FROM public.onde_depots WHERE email = membre) THEN RAISE EXCEPTION 'ECHEC : dépôts gardés après suppression des données'; END IF;

  RAISE EXCEPTION 'ONDE_DEPOTS_OK';
END $$;
