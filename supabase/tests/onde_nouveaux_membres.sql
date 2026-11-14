-- Vérification de la règle « Les nouveaux membres du mois » (L'Onde du Sud), avec des adhésions fictives.
-- Tout s'exécute dans un seul bloc qui se termine par une erreur volontaire : rien n'est conservé en base.
-- Résultat attendu : « ONDE_TEST_OK ». Toute autre erreur indique une règle cassée.
DO $$
DECLARE
  r record;
  compte text[] := '{}';
BEGIN
  -- A : toute première adhésion, novembre 2026
  INSERT INTO public.adhesions (email, prenom, nom, statut, date_adhesion, formule)
    VALUES ('onde-test-a@exemple.invalid', 'Test', 'Premiere', 'active', '2026-11-05 10:00+01', 'personne');
  -- B : ancienne adhérente (2024), rien en 2025, revient en novembre 2026
  INSERT INTO public.adhesions (email, prenom, nom, statut, date_adhesion, formule) VALUES
    ('onde-test-b@exemple.invalid', 'Test', 'Retour', 'expired', '2024-03-10 10:00+01', 'personne'),
    ('onde-test-b@exemple.invalid', 'Test', 'Retour', 'active', '2026-11-06 10:00+01', 'personne');
  -- C : adhérente 2025 qui renouvelle en novembre 2026
  INSERT INTO public.adhesions (email, prenom, nom, statut, date_adhesion, formule) VALUES
    ('onde-test-c@exemple.invalid', 'Test', 'Renouvelle', 'expired', '2025-04-10 10:00+02', 'personne'),
    ('onde-test-c@exemple.invalid', 'Test', 'Renouvelle', 'active', '2026-11-07 10:00+01', 'personne');
  -- D : paiement encore à vérifier, jamais compté
  INSERT INTO public.adhesions (email, prenom, nom, statut, date_adhesion, formule)
    VALUES ('onde-test-d@exemple.invalid', 'Test', 'AVerifier', 'a_verifier', '2026-11-08 10:00+01', 'personne');

  FOR r IN SELECT c.email, c.du_mois FROM public.onde_membres_calcul('2026-11-01', NULL) c
    WHERE c.email LIKE 'onde-test-%@exemple.invalid' LOOP
    IF r.du_mois THEN compte := compte || r.email; END IF;
  END LOOP;

  IF NOT ('onde-test-a@exemple.invalid' = ANY(compte)) THEN RAISE EXCEPTION 'ECHEC : première adhésion non comptée'; END IF;
  IF NOT ('onde-test-b@exemple.invalid' = ANY(compte)) THEN RAISE EXCEPTION 'ECHEC : retour après une année sans adhésion non compté'; END IF;
  IF 'onde-test-c@exemple.invalid' = ANY(compte) THEN RAISE EXCEPTION 'ECHEC : renouvellement compté à tort'; END IF;
  IF 'onde-test-d@exemple.invalid' = ANY(compte) THEN RAISE EXCEPTION 'ECHEC : paiement à vérifier compté à tort'; END IF;

  -- Le mois d'arrivée fait foi : en octobre 2026, personne de ces fiches n'est nouveau.
  IF EXISTS (SELECT 1 FROM public.onde_membres_calcul('2026-10-01', NULL) c
    WHERE c.email LIKE 'onde-test-%@exemple.invalid' AND c.du_mois) THEN
    RAISE EXCEPTION 'ECHEC : arrivée comptée dans le mauvais mois';
  END IF;

  RAISE EXCEPTION 'ONDE_TEST_OK %', array_to_string(compte, ', ');
END $$;
