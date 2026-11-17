-- Vérification du bloc « Ce qui bouge » et de « Pour aller plus loin » (bloc « À l'écoute ») de L'Onde du Sud,
-- sur un numéro fictif (n°9001). Le bloc se termine par une erreur volontaire : rien n'est conservé.
-- Résultat attendu : « ONDE_BOUGE_OK ». Toute autre erreur indique une règle cassée.
DO $$
DECLARE
  editeur uuid := gen_random_uuid();
  membre uuid := gen_random_uuid();
  nid uuid;
  b jsonb;
  ok boolean;
  bouge jsonb := jsonb_build_object('id', 'b-bouge', 'type', 'ce_qui_bouge', 'rubrique', 'Ce qui bouge',
    'titre', '<b>L''IA</b> et la voix', 'texte', 'Un texte <script>alert(1)</script>de fond.',
    'source_nom', 'CB News', 'source_lien', 'https://www.cbnews.fr/article', 'question', 'Et toi ?');
BEGIN
  -- Un visiteur ou un membre sans rôle ne crée ni ne modifie un numéro : règles d'accès de la base
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onde_numeros' AND cmd = 'INSERT' AND with_check ILIKE '%peut_editer_onde()%')
     OR NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onde_numeros' AND cmd = 'UPDATE' AND qual ILIKE '%peut_editer_onde()%' AND with_check ILIKE '%peut_editer_onde()%')
     OR EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onde_numeros' AND cmd IN ('INSERT', 'UPDATE', 'ALL') AND coalesce(with_check, qual) NOT ILIKE '%peut_editer_onde()%')
     OR has_table_privilege('anon', 'public.onde_numeros', 'INSERT') OR has_table_privilege('anon', 'public.onde_numeros', 'UPDATE') THEN
    RAISE EXCEPTION 'ECHEC : règles d''accès des numéros';
  END IF;
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  IF public.peut_editer_onde() THEN RAISE EXCEPTION 'ECHEC : un visiteur peut éditer L''Onde'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', membre::text, 'role', 'authenticated')::text, true);
  IF public.peut_editer_onde() THEN RAISE EXCEPTION 'ECHEC : un membre sans rôle peut éditer L''Onde'; END IF;

  -- Éditeur·ice fictif·ve : le bloc est accepté et nettoyé (balises retirées)
  INSERT INTO auth.users (id, email, aud, role) VALUES (editeur, 'onde-bouge-editeur@exemple.invalid', 'authenticated', 'authenticated');
  INSERT INTO public.user_roles (user_id, role) VALUES (editeur, 'editeur');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', editeur::text, 'role', 'authenticated')::text, true);
  IF NOT public.peut_editer_onde() THEN RAISE EXCEPTION 'ECHEC : l''éditeur·ice ne peut pas éditer'; END IF;
  INSERT INTO public.onde_numeros (numero, mois, titre, chapeau, blocs, statut)
    VALUES (9001, '2030-01-01', 'Essai', '', jsonb_build_array(bouge, jsonb_build_object('id', 'b-pod', 'type', 'podcast', 'rubrique', 'À l''écoute',
      'plus_loin_texte', 'Le making-of', 'plus_loin_lien', 'https://exemple.invalid/making-of')), 'brouillon')
    RETURNING id INTO nid;
  SELECT blocs->0 INTO b FROM public.onde_numeros WHERE id = nid;
  IF b->>'titre' <> 'L''IA et la voix' OR b->>'texte' LIKE '%<script%' OR b->>'source_lien' <> 'https://www.cbnews.fr/article'
     OR b->>'question' <> 'Et toi ?' OR b->>'source_nom' <> 'CB News' THEN
    RAISE EXCEPTION 'ECHEC : bloc mal nettoyé %', b;
  END IF;
  SELECT blocs->1 INTO b FROM public.onde_numeros WHERE id = nid;
  IF b->>'plus_loin_lien' <> 'https://exemple.invalid/making-of' OR b->>'plus_loin_texte' <> 'Le making-of' THEN
    RAISE EXCEPTION 'ECHEC : « Pour aller plus loin » non gardé %', b;
  END IF;

  -- Liens : https seulement (pas de http, pas de javascript:, pas de page du site)
  FOREACH b IN ARRAY ARRAY['"http://exemple.invalid"'::jsonb, '"javascript:alert(1)"'::jsonb, '"/agenda"'::jsonb, '"https://exemple.invalid/a b"'::jsonb, '"https://exemple.invalid/a\"b"'::jsonb] LOOP
    ok := false;
    BEGIN
      UPDATE public.onde_numeros SET blocs = jsonb_build_array(bouge || jsonb_build_object('source_lien', b)) WHERE id = nid;
    EXCEPTION WHEN OTHERS THEN ok := SQLSTATE = 'P0001';
    END;
    IF NOT ok THEN RAISE EXCEPTION 'ECHEC : lien de source accepté %', b; END IF;
    ok := false;
    BEGIN
      UPDATE public.onde_numeros SET blocs = jsonb_build_array(jsonb_build_object('id', 'p', 'type', 'podcast', 'rubrique', 'À l''écoute', 'plus_loin_lien', b)) WHERE id = nid;
    EXCEPTION WHEN OTHERS THEN ok := SQLSTATE = 'P0001';
    END;
    IF NOT ok THEN RAISE EXCEPTION 'ECHEC : lien « Pour aller plus loin » accepté %', b; END IF;
  END LOOP;

  -- Longueurs : titre 120, texte 1 200, question 200
  FOREACH b IN ARRAY ARRAY[jsonb_build_object('titre', repeat('a', 121)), jsonb_build_object('texte', repeat('a', 1201)), jsonb_build_object('question', repeat('a', 201))] LOOP
    ok := false;
    BEGIN
      UPDATE public.onde_numeros SET blocs = jsonb_build_array(bouge || b) WHERE id = nid;
    EXCEPTION WHEN OTHERS THEN ok := SQLSTATE = 'P0001';
    END;
    IF NOT ok THEN RAISE EXCEPTION 'ECHEC : champ trop long accepté %', b; END IF;
  END LOOP;

  -- Titre et texte obligatoires à la publication
  ok := false;
  BEGIN
    UPDATE public.onde_numeros SET blocs = jsonb_build_array(bouge - 'texte'), statut = 'publie' WHERE id = nid;
  EXCEPTION WHEN OTHERS THEN ok := SQLSTATE = 'P0001';
  END;
  IF NOT ok THEN RAISE EXCEPTION 'ECHEC : publication sans texte acceptée'; END IF;

  RAISE EXCEPTION 'ONDE_BOUGE_OK';
END $$;
