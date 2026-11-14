-- Vérification de la case « Ajouter au prochain numéro de L'Onde du Sud » de l'agenda (admins seulement)
-- et du carnet Instagram des organisateur·ices, avec des comptes, un événement et des numéros fictifs
-- (numéros 9981 à 9983, mois de l'an 2000 : plus anciens que tout vrai brouillon, donc choisis en premier).
-- Le bloc se termine par une erreur volontaire : rien n'est conservé.
-- Résultat attendu : « ONDE_AGENDA_OK ». Toute autre erreur indique une règle cassée.
DO $$
DECLARE
  admin uuid := gen_random_uuid();
  editeur uuid := gen_random_uuid();
  ev uuid;
  b1 uuid := gen_random_uuid();
  b2 uuid := gen_random_uuid();
  pub uuid := gen_random_uuid();
  base text := 'https://pnxbuhtqiruayzykaagw.supabase.co/functions/v1/onde-media/';
  vrais_avant text;
  r jsonb;
  ok boolean;
  pleins jsonb := '[]'::jsonb;
BEGIN
  SELECT string_agg(id::text || updated_at::text || blocs::text, '|' ORDER BY id) INTO vrais_avant FROM public.onde_numeros;

  -- Droits : aucun accès pour les visiteur·ices
  IF has_function_privilege('anon', 'public.onde_agenda_basculer(uuid, boolean)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.onde_agenda_etat()', 'EXECUTE')
     OR has_table_privilege('anon', 'public.evenements_instagram', 'SELECT') THEN
    RAISE EXCEPTION 'ECHEC : un visiteur a accès aux fonctions de l''agenda';
  END IF;

  INSERT INTO auth.users (id, email, aud, role) VALUES
    (admin, 'onde-agenda-admin@exemple.invalid', 'authenticated', 'authenticated'),
    (editeur, 'onde-agenda-editeur@exemple.invalid', 'authenticated', 'authenticated');
  INSERT INTO public.user_roles (user_id, role) VALUES (admin, 'admin'), (editeur, 'editeur');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', admin::text, 'role', 'authenticated', 'email', 'onde-agenda-admin@exemple.invalid')::text, true);
  INSERT INTO public.evenements (titre, date_debut, type, statut) VALUES ('Essai agenda Onde', now() + interval '20 days', 'rencontre', 'en_relecture') RETURNING id INTO ev;

  -- Visiteur, membre sans rôle et éditeur·ice de L'Onde : refusé·es
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  ok := false;
  BEGIN PERFORM public.onde_agenda_basculer(ev, true); EXCEPTION WHEN OTHERS THEN ok := SQLSTATE = '42501'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un visiteur ajoute un événement à L''Onde'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', editeur::text, 'role', 'authenticated', 'email', 'onde-agenda-editeur@exemple.invalid')::text, true);
  ok := false;
  BEGIN PERFORM public.onde_agenda_basculer(ev, true); EXCEPTION WHEN OTHERS THEN ok := SQLSTATE = '42501'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un·e éditeur·ice utilise la case de l''agenda'; END IF;
  ok := false;
  BEGIN PERFORM public.onde_agenda_etat(); EXCEPTION WHEN OTHERS THEN ok := SQLSTATE = '42501'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un·e éditeur·ice lit l''état de l''agenda'; END IF;

  -- Numéros fictifs : un publié (le plus ancien, jamais modifié), deux brouillons
  PERFORM set_config('request.jwt.claims', json_build_object('sub', admin::text, 'role', 'authenticated', 'email', 'onde-agenda-admin@exemple.invalid')::text, true);
  INSERT INTO public.onde_numeros (id, numero, mois, slug, statut, blocs) VALUES
    (pub, 9983, '2000-11-01', 'z-agenda-pub', 'brouillon', jsonb_build_array(jsonb_build_object('id', 'x', 'type', 'evenements', 'rubrique', 'À l''agenda', 'evenements', jsonb_build_array(ev::text))));
  UPDATE public.onde_numeros SET titre = 'Essai', chapeau = 'Chapeau', couverture_url = base || pub || '/c.jpg', couverture_alt = 'Photo', statut = 'publie' WHERE id = pub;
  INSERT INTO public.onde_numeros (id, numero, mois, slug, statut) VALUES
    (b1, 9981, '2000-12-01', 'z-agenda-1', 'brouillon'),
    (b2, 9982, '2001-01-01', 'z-agenda-2', 'brouillon');

  r := public.onde_agenda_etat();
  IF (r->'prochain'->>'id')::uuid IS DISTINCT FROM b1 THEN RAISE EXCEPTION 'ECHEC : le prochain brouillon n''est pas le plus ancien : %', r->'prochain'; END IF;
  IF NOT (r->'liens' @> jsonb_build_array(jsonb_build_object('evenement_id', ev::text, 'numero', 9983, 'statut', 'publie'))) THEN
    RAISE EXCEPTION 'ECHEC : badge du numéro publié absent';
  END IF;

  -- Cochée : bloc « À l'agenda » créé dans le plus ancien brouillon (événement en relecture accepté)
  r := public.onde_agenda_basculer(ev, true);
  IF r->>'code' <> 'ajoute' OR (r->>'numero')::int <> 9981 OR NOT (r->>'bloc_cree')::boolean THEN RAISE EXCEPTION 'ECHEC : ajout : %', r; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.onde_numeros WHERE id = b1 AND blocs @> jsonb_build_array(jsonb_build_object('type', 'evenements', 'rubrique', 'À l''agenda', 'evenements', jsonb_build_array(ev::text)))) THEN
    RAISE EXCEPTION 'ECHEC : bloc « À l''agenda » non créé';
  END IF;
  -- Pas de doublon
  r := public.onde_agenda_basculer(ev, true);
  IF r->>'code' <> 'deja' THEN RAISE EXCEPTION 'ECHEC : doublon : %', r; END IF;
  IF (SELECT count(*) FROM public.onde_numeros o, jsonb_array_elements(o.blocs) b, jsonb_array_elements(b->'evenements') e
      WHERE o.id = b1 AND b->>'type' = 'evenements' AND e #>> '{}' = ev::text) <> 1 THEN RAISE EXCEPTION 'ECHEC : événement en double'; END IF;
  -- La publication de l'événement reste indépendante
  IF (SELECT statut FROM public.evenements WHERE id = ev) <> 'en_relecture' THEN RAISE EXCEPTION 'ECHEC : statut de l''événement modifié'; END IF;

  -- Décochée : retiré du brouillon (bloc vide supprimé) ; le numéro publié ne bouge pas
  r := public.onde_agenda_basculer(ev, false);
  IF r->>'code' <> 'retire' OR NOT (r->'numeros' @> '[9981]'::jsonb) THEN RAISE EXCEPTION 'ECHEC : retrait : %', r; END IF;
  IF EXISTS (SELECT 1 FROM public.onde_numeros WHERE id = b1 AND jsonb_array_length(blocs) > 0) THEN RAISE EXCEPTION 'ECHEC : bloc vide conservé'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.onde_numeros WHERE id = pub AND statut = 'publie' AND blocs->0->'evenements' ? ev::text) THEN
    RAISE EXCEPTION 'ECHEC : un numéro publié a été modifié';
  END IF;

  -- Bloc déjà plein (8 événements) : message, rien d'ajouté
  SELECT jsonb_agg(gen_random_uuid()::text) INTO pleins FROM generate_series(1, 8);
  UPDATE public.onde_numeros SET blocs = jsonb_build_array(jsonb_build_object('id', 'p', 'type', 'evenements', 'rubrique', 'À l''agenda', 'resume', 'Notre sélection', 'evenements', pleins)) WHERE id = b1;
  r := public.onde_agenda_basculer(ev, true);
  IF r->>'code' <> 'plein' THEN RAISE EXCEPTION 'ECHEC : limite de 8 : %', r; END IF;
  IF (SELECT jsonb_array_length(blocs->0->'evenements') FROM public.onde_numeros WHERE id = b1) <> 8 THEN RAISE EXCEPTION 'ECHEC : 9e événement ajouté'; END IF;
  -- Bloc existant avec de la place : ajouté dans ce bloc, sans en créer un autre ; un bloc avec un résumé reste au retrait
  UPDATE public.onde_numeros SET blocs = jsonb_build_array(jsonb_build_object('id', 'p', 'type', 'evenements', 'rubrique', 'Nos dates', 'resume', 'Notre sélection', 'evenements', '[]'::jsonb)) WHERE id = b1;
  r := public.onde_agenda_basculer(ev, true);
  IF r->>'code' <> 'ajoute' OR (r->>'bloc_cree')::boolean THEN RAISE EXCEPTION 'ECHEC : ajout dans le bloc existant : %', r; END IF;
  PERFORM public.onde_agenda_basculer(ev, false);
  IF NOT EXISTS (SELECT 1 FROM public.onde_numeros WHERE id = b1 AND blocs->0->>'rubrique' = 'Nos dates') THEN RAISE EXCEPTION 'ECHEC : bloc avec résumé supprimé'; END IF;

  -- Le cas « aucun brouillon » est vérifié à l'écran (un vrai brouillon existe) ; ici, un événement inconnu est refusé proprement.
  r := public.onde_agenda_basculer(gen_random_uuid(), true);
  IF r->>'code' <> 'introuvable' THEN RAISE EXCEPTION 'ECHEC : événement inconnu : %', r; END IF;

  -- Carnet Instagram : format vérifié, mis en minuscules
  INSERT INTO public.evenements_instagram (evenement_id, compte) VALUES (ev, ' La.Claque_Studio ');
  IF (SELECT compte FROM public.evenements_instagram WHERE evenement_id = ev) <> '@la.claque_studio' THEN RAISE EXCEPTION 'ECHEC : compte Instagram non nettoyé'; END IF;
  ok := false;
  BEGIN UPDATE public.evenements_instagram SET compte = '@pas bon!' WHERE evenement_id = ev; EXCEPTION WHEN check_violation THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : compte Instagram invalide accepté'; END IF;
  ok := false;
  BEGIN UPDATE public.evenements_instagram SET compte = '@fin.' WHERE evenement_id = ev; EXCEPTION WHEN check_violation THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : compte terminé par un point accepté'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evenements_instagram' AND cmd = 'SELECT' AND qual LIKE '%has_role%admin%') THEN
    RAISE EXCEPTION 'ECHEC : lecture du carnet Instagram non réservée aux admins';
  END IF;

  -- Les vrais numéros n'ont pas bougé
  IF (SELECT string_agg(id::text || updated_at::text || blocs::text, '|' ORDER BY id) FROM public.onde_numeros WHERE id NOT IN (b1, b2, pub)) IS DISTINCT FROM vrais_avant THEN
    RAISE EXCEPTION 'ECHEC : un vrai numéro a été modifié';
  END IF;

  RAISE EXCEPTION 'ONDE_AGENDA_OK';
END $$;
