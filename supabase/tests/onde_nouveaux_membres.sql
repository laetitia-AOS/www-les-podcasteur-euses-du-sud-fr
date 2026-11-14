-- Vérification de la règle « Les nouveaux membres du mois » (L'Onde du Sud), avec des adhésions et fiches fictives.
-- Période : du 25 du mois précédent au 24 du mois choisi, inclus, heure de Paris
-- (bloc « novembre 2026 », numéro de décembre → adhésions du 25 octobre au 24 novembre 2026).
-- Tout s'exécute dans un seul bloc qui se termine par une erreur volontaire : rien n'est conservé en base.
-- Résultat attendu : « ONDE_TEST_OK ». Toute autre erreur indique une règle cassée.
DO $$
DECLARE
  r record;
  cites text[] := '{}';
  sans_fiche text[] := '{}';
  tous text[] := '{}';
BEGIN
  INSERT INTO public.adhesions (email, prenom, nom, statut, date_adhesion, formule) VALUES
    -- A : première adhésion le 25 octobre à 0 h 30 (première borne, incluse)
    ('onde-test-a@exemple.invalid', 'Test', 'Debut', 'active', '2026-10-25 00:30+02', 'personne'),
    -- B : première adhésion le 24 novembre à 23 h 30 (dernière borne, incluse)
    ('onde-test-b@exemple.invalid', 'Test', 'Fin', 'active', '2026-11-24 23:30+01', 'personne'),
    -- C : le 24 octobre à 23 h 30 : période précédente
    ('onde-test-c@exemple.invalid', 'Test', 'Avant', 'active', '2026-10-24 23:30+02', 'personne'),
    -- D : le 25 novembre à 0 h 30 : période suivante
    ('onde-test-d@exemple.invalid', 'Test', 'Apres', 'active', '2026-11-25 00:30+01', 'personne'),
    -- E : ancienne adhérente (2024), rien en 2025, revient le 10 novembre 2026
    ('onde-test-e@exemple.invalid', 'Test', 'Retour', 'expired', '2024-03-10 10:00+01', 'personne'),
    ('onde-test-e@exemple.invalid', 'Test', 'Retour', 'active', '2026-11-10 10:00+01', 'personne'),
    -- F : adhérente 2025 qui renouvelle le 10 novembre 2026
    ('onde-test-f@exemple.invalid', 'Test', 'Renouvelle', 'expired', '2025-04-10 10:00+02', 'personne'),
    ('onde-test-f@exemple.invalid', 'Test', 'Renouvelle', 'active', '2026-11-10 10:00+01', 'personne'),
    -- G : première adhésion le 12 novembre, sans fiche
    ('onde-test-g@exemple.invalid', 'Test', 'SansFiche', 'active', '2026-11-12 10:00+01', 'personne'),
    -- H : paiement encore à vérifier, jamais compté
    ('onde-test-h@exemple.invalid', 'Test', 'AVerifier', 'a_verifier', '2026-11-08 10:00+01', 'personne');

  -- Fiches publiques sans photo de profil (A, B, C, D, E, F) ; G n'a pas de fiche.
  INSERT INTO public.podcasts (nom_podcast, lien_ecoute, description, email, prenom, nom, type_profil, consent_contact, consent_mise_en_relation)
  SELECT 'Podcast fictif ' || x, 'https://exemple.invalid/' || x, 'Fiche fictive pour essai.', 'onde-test-' || x || '@exemple.invalid', 'test', upper('fictif' || x), 'podcasteur', false, false
  FROM unnest(ARRAY['a','b','c','d','e','f']) x;
  UPDATE public.podcasts SET valide = true WHERE email LIKE 'onde-test-%@exemple.invalid';

  FOR r IN SELECT c.* FROM public.onde_membres_calcul('2026-11-01', NULL) c WHERE c.email LIKE 'onde-test-%@exemple.invalid' LOOP
    tous := tous || r.email;
    IF r.complet AND NOT r.deja THEN cites := cites || r.email; END IF;
    IF NOT r.complet AND NOT r.deja THEN sans_fiche := sans_fiche || r.email; END IF;
  END LOOP;

  IF NOT ('onde-test-a@exemple.invalid' = ANY(cites)) THEN RAISE EXCEPTION 'ECHEC : adhésion du 25 (borne incluse) non citée'; END IF;
  IF NOT ('onde-test-b@exemple.invalid' = ANY(cites)) THEN RAISE EXCEPTION 'ECHEC : adhésion du 24 (borne incluse) non citée'; END IF;
  IF 'onde-test-c@exemple.invalid' = ANY(tous) THEN RAISE EXCEPTION 'ECHEC : adhésion du 24 du mois précédent comptée à tort'; END IF;
  IF 'onde-test-d@exemple.invalid' = ANY(tous) THEN RAISE EXCEPTION 'ECHEC : adhésion du 25 du mois comptée à tort'; END IF;
  IF NOT ('onde-test-e@exemple.invalid' = ANY(cites)) THEN RAISE EXCEPTION 'ECHEC : retour après une année sans adhésion non cité'; END IF;
  IF 'onde-test-f@exemple.invalid' = ANY(tous) THEN RAISE EXCEPTION 'ECHEC : renouvellement compté à tort'; END IF;
  IF 'onde-test-g@exemple.invalid' = ANY(cites) OR NOT ('onde-test-g@exemple.invalid' = ANY(sans_fiche)) THEN RAISE EXCEPTION 'ECHEC : adhésion sans fiche citée ou non comptée'; END IF;
  IF 'onde-test-h@exemple.invalid' = ANY(tous) THEN RAISE EXCEPTION 'ECHEC : paiement à vérifier compté à tort'; END IF;

  -- C appartient à la période précédente, D à la suivante.
  IF NOT EXISTS (SELECT 1 FROM public.onde_membres_calcul('2026-10-01', NULL) c WHERE c.email = 'onde-test-c@exemple.invalid') THEN
    RAISE EXCEPTION 'ECHEC : adhésion du 24 octobre absente de la période d''octobre';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.onde_membres_calcul('2026-12-01', NULL) c WHERE c.email = 'onde-test-d@exemple.invalid') THEN
    RAISE EXCEPTION 'ECHEC : adhésion du 25 novembre absente de la période de décembre';
  END IF;

  -- Personne ne lit les adhésions sans passer par les fonctions de l'équipe.
  IF has_function_privilege('anon', 'public.onde_membres_calcul(date, uuid)', 'execute')
     OR has_function_privilege('authenticated', 'public.onde_membres_calcul(date, uuid)', 'execute')
     OR has_function_privilege('anon', 'public.onde_nouveaux_membres_bilan(uuid, text, date)', 'execute')
     OR has_table_privilege('anon', 'public.adhesions', 'select') AND EXISTS (
       SELECT 1 FROM pg_policies WHERE tablename = 'adhesions' AND cmd IN ('SELECT', 'ALL') AND 'anon' = ANY(roles)) THEN
    RAISE EXCEPTION 'ECHEC : un visiteur peut lire des adhésions';
  END IF;

  RAISE EXCEPTION 'ONDE_TEST_OK cités : % ; sans fiche : %', array_to_string(cites, ', '), array_to_string(sans_fiche, ', ');
END $$;
