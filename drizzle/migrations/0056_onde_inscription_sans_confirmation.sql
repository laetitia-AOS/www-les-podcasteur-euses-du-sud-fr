CREATE OR REPLACE FUNCTION public.onde_inscrire(_prenom text, _email text, _consentement boolean, _source text, _nom text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  m text;
  p text;
  n text;
  t text;
  r public.onde_abonnes%ROWTYPE;
BEGIN
  IF _source IS NULL OR _source NOT IN ('onde', 'evenement') THEN
    RAISE EXCEPTION 'Formulaire inconnu.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT coalesce(_consentement, false) THEN
    RAISE EXCEPTION 'Cochez la case pour accepter de recevoir L''Onde du Sud.' USING ERRCODE = 'P0001';
  END IF;
  m := public.pds_email(_email);
  p := public.pds_txt(_prenom, 100, 'Prénom', _source = 'onde');
  n := public.pds_txt(_nom, 100, 'Nom', false);
  t := public.onde_texte_consentement(_source);

  -- Plus d'étape de confirmation (choix de l'association) : la case cochée vaut accord, l'abonnement est actif tout de suite.
  SELECT * INTO r FROM public.onde_abonnes a WHERE lower(a.email) = m FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.onde_abonnes (email, prenom, nom, source, statut, consentement_le, consentement_texte, confirme_le, essais, essais_depuis)
    VALUES (m, p, n, _source, 'actif', now(), t, now(), 1, now());
    RETURN 'ok';
  END IF;

  -- Anti-abus : 5 envois par heure et par adresse
  IF r.essais_depuis > now() - interval '1 hour' THEN
    IF r.essais >= 5 THEN PERFORM public.pds_trop_d_envois(); END IF;
    r.essais := r.essais + 1;
  ELSE
    r.essais := 1;
    r.essais_depuis := now();
  END IF;

  IF r.statut = 'actif' THEN
    UPDATE public.onde_abonnes SET prenom = coalesce(p, prenom), nom = coalesce(n, nom), essais = r.essais, essais_depuis = r.essais_depuis, updated_at = now()
    WHERE id = r.id;
  ELSE
    -- En attente ou désinscrit·e : la nouvelle demande, avec la case cochée, réactive l'abonnement
    UPDATE public.onde_abonnes SET prenom = coalesce(p, prenom), nom = coalesce(n, nom), statut = 'actif', consentement_le = now(), consentement_texte = t,
      confirme_le = now(), desinscrit_le = NULL, essais = r.essais, essais_depuis = r.essais_depuis, updated_at = now()
    WHERE id = r.id;
  END IF;
  RETURN 'ok';
END $function$;