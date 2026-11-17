ALTER TABLE public.onde_abonnes ADD COLUMN IF NOT EXISTS nom text;

DROP FUNCTION IF EXISTS public.onde_inscrire(text, text, boolean, text);

CREATE OR REPLACE FUNCTION public.onde_inscrire(_prenom text, _email text, _consentement boolean, _source text, _nom text DEFAULT NULL)
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

  SELECT * INTO r FROM public.onde_abonnes a WHERE lower(a.email) = m FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.onde_abonnes (email, prenom, nom, source, statut, consentement_le, consentement_texte, essais, essais_depuis)
    VALUES (m, p, n, _source, 'en_attente', now(), t, 1, now());
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
    -- En attente ou désinscrit·e : nouvelle demande, à confirmer par le lien envoyé par e-mail
    UPDATE public.onde_abonnes SET prenom = coalesce(p, prenom), nom = coalesce(n, nom), statut = 'en_attente', consentement_le = now(), consentement_texte = t,
      desinscrit_le = NULL, essais = r.essais, essais_depuis = r.essais_depuis, updated_at = now()
    WHERE id = r.id;
  END IF;
  RETURN 'ok';
END $function$;

REVOKE ALL ON FUNCTION public.onde_inscrire(text, text, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.onde_inscrire(text, text, boolean, text, text) TO service_role;

DROP FUNCTION IF EXISTS public.onde_abonnes_liste();

CREATE OR REPLACE FUNCTION public.onde_abonnes_liste()
 RETURNS TABLE(id uuid, email text, prenom text, nom text, source text, statut text, consentement_le timestamp with time zone, consentement_texte text, confirme_le timestamp with time zone, desinscrit_le timestamp with time zone, created_at timestamp with time zone, adherent boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Réservé aux admins.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT a.id, a.email, a.prenom, a.nom, a.source, a.statut, a.consentement_le, a.consentement_texte,
      a.confirme_le, a.desinscrit_le, a.created_at, public.membre_a_jour(a.email)
    FROM public.onde_abonnes a
    ORDER BY a.created_at DESC;
END $function$;

REVOKE ALL ON FUNCTION public.onde_abonnes_liste() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onde_abonnes_liste() TO authenticated, service_role;