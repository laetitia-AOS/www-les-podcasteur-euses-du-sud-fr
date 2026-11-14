-- Vérification du pied des numéros de L'Onde du Sud (lien de don) et du réabonnement d'un·e membre désinscrit·e,
-- avec des adresses fictives (@exemple.invalid). Le bloc se termine par une erreur volontaire : rien n'est conservé.
-- Résultat attendu : « ONDE_PIED_OK ». Toute autre erreur indique une règle cassée.
DO $$
DECLARE
  membre text := 'onde-pied-membre@exemple.invalid';
  editeur uuid := gen_random_uuid();
  r jsonb;
  l text;
  ok boolean;
BEGIN
  -- Aucun accès direct aux réglages ; un visiteur ne peut que lire le lien
  IF has_table_privilege('anon', 'public.onde_reglages', 'SELECT') OR has_table_privilege('authenticated', 'public.onde_reglages', 'UPDATE')
     OR has_table_privilege('anon', 'public.onde_reglages', 'UPDATE') OR has_table_privilege('authenticated', 'public.onde_reglages', 'INSERT') THEN
    RAISE EXCEPTION 'ECHEC : les réglages sont modifiables en direct';
  END IF;
  IF has_function_privilege('anon', 'public.onde_regler_lien_don(text)', 'EXECUTE') OR NOT has_function_privilege('anon', 'public.onde_lien_don()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.onde_me_reabonner()', 'EXECUTE') OR has_function_privilege('anon', 'public.mon_abonnement_onde()', 'EXECUTE') THEN
    RAISE EXCEPTION 'ECHEC : droits des fonctions du pied';
  END IF;

  -- Un visiteur (ou un membre sans rôle) ne peut pas modifier le lien de don
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  ok := false;
  BEGIN PERFORM public.onde_regler_lien_don('https://exemple.invalid/don'); EXCEPTION WHEN OTHERS THEN ok := SQLSTATE = '42501'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un visiteur modifie le lien de don'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated', 'email', membre)::text, true);
  ok := false;
  BEGIN PERFORM public.onde_regler_lien_don('https://exemple.invalid/don'); EXCEPTION WHEN OTHERS THEN ok := SQLSTATE = '42501'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : un membre sans rôle modifie le lien de don'; END IF;

  -- Un·e éditeur·ice : https obligatoire ; vide = pas de bouton
  INSERT INTO auth.users (id, email, aud, role) VALUES (editeur, 'onde-pied-editeur@exemple.invalid', 'authenticated', 'authenticated');
  INSERT INTO public.user_roles (user_id, role) VALUES (editeur, 'editeur');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', editeur::text, 'role', 'authenticated', 'email', 'onde-pied-editeur@exemple.invalid')::text, true);
  IF NOT public.peut_editer_onde() THEN RAISE EXCEPTION 'ECHEC : éditeur·ice fictif·ve non reconnu·e'; END IF;
  ok := false;
  BEGIN PERFORM public.onde_regler_lien_don('http://exemple.invalid/don'); EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%https://%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : lien en http accepté'; END IF;
  ok := false;
  BEGIN PERFORM public.onde_regler_lien_don('javascript:alert(1)'); EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%https://%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : lien javascript accepté'; END IF;
  -- (une instruction par appel : une fonction de lecture voit l'état du début de l'instruction)
  l := public.onde_regler_lien_don('  https://www.helloasso.com/associations/exemple/formulaires/1  ');
  IF l IS DISTINCT FROM 'https://www.helloasso.com/associations/exemple/formulaires/1' THEN RAISE EXCEPTION 'ECHEC : lien rendu %', l; END IF;
  l := public.onde_lien_don();
  IF l IS DISTINCT FROM 'https://www.helloasso.com/associations/exemple/formulaires/1' THEN RAISE EXCEPTION 'ECHEC : lien de don non enregistré (%)', l; END IF;
  l := public.onde_regler_lien_don('');
  IF l IS NOT NULL THEN RAISE EXCEPTION 'ECHEC : vidage rendu %', l; END IF;
  l := public.onde_lien_don();
  IF l IS NOT NULL THEN RAISE EXCEPTION 'ECHEC : lien de don non vidé'; END IF;

  -- Membre à jour désinscrit·e : « membre » + « desinscrit », puis réabonnement en un clic
  INSERT INTO public.adhesions (email, prenom, nom, statut, date_adhesion, formule) VALUES (membre, 'Camille', 'Testeuse', 'active', now(), 'personne');
  INSERT INTO public.onde_abonnes (email, source, statut, desinscrit_le) VALUES (membre, 'adhesion', 'desinscrit', now());
  PERFORM set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated', 'email', membre)::text, true);
  r := public.mon_abonnement_onde();
  IF NOT (r->>'membre')::boolean OR r->>'statut' <> 'desinscrit' THEN RAISE EXCEPTION 'ECHEC : état du membre désinscrit : %', r; END IF;
  IF EXISTS (SELECT 1 FROM public.onde_destinataires() d WHERE d.email = membre) THEN RAISE EXCEPTION 'ECHEC : membre désinscrit encore destinataire'; END IF;
  PERFORM public.onde_me_reabonner();
  r := public.mon_abonnement_onde();
  IF r->>'statut' IS DISTINCT FROM 'actif' THEN RAISE EXCEPTION 'ECHEC : réabonnement non enregistré : %', r; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.onde_abonnes WHERE email = membre AND consentement_le IS NOT NULL AND desinscrit_le IS NULL
    AND consentement_texte = public.onde_texte_consentement('reinscription')) THEN
    RAISE EXCEPTION 'ECHEC : consentement du réabonnement non gardé';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.onde_destinataires() d WHERE d.email = membre) THEN RAISE EXCEPTION 'ECHEC : membre réabonné absent des destinataires'; END IF;

  -- Sans adhésion à jour : pas de réabonnement en un clic (il faut confirmer par e-mail)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid()::text, 'role', 'authenticated', 'email', 'onde-pied-sans@exemple.invalid')::text, true);
  ok := false;
  BEGIN PERFORM public.onde_me_reabonner(); EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%adhérent·es à jour%'; END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : réabonnement en un clic sans adhésion'; END IF;
  r := public.mon_abonnement_onde();
  IF (r->>'membre')::boolean THEN RAISE EXCEPTION 'ECHEC : non-membre vu comme membre'; END IF;

  RAISE EXCEPTION 'ONDE_PIED_OK';
END $$;
