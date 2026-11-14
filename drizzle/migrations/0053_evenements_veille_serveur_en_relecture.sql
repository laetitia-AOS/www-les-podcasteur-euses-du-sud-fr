CREATE OR REPLACE FUNCTION public.guard_evenements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
  fiche record;
  role_sql text := coalesce(current_setting('role', true), 'none');
  role_jwt text := coalesce(auth.role(), '');
  serveur boolean;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    NEW.publie := (NEW.statut = 'publie');
    RETURN NEW;
  END IF;

  -- Connexion serveur de confiance (veille automatique) : jamais un visiteur ni un compte connecté.
  -- PostgREST se connecte en « authenticator » puis prend le rôle anon / authenticated / service_role.
  serveur := auth.uid() IS NULL
    AND role_jwt NOT IN ('anon', 'authenticated')
    AND role_sql NOT IN ('anon', 'authenticated')
    AND (role_sql = 'service_role'
         OR (role_sql IN ('none', 'postgres', 'supabase_admin') AND session_user <> 'authenticator'));

  IF serveur AND NEW.origine = 'pds' THEN
    NEW := public.pds_evenement_champs(NEW);
    IF NEW.date_debut < now() - interval '1 day' OR NEW.date_debut > now() + interval '3 years' THEN
      RAISE EXCEPTION 'Date de début invalide.' USING ERRCODE = 'P0001';
    END IF;
    -- Toujours en relecture : seul un admin publie, à la main.
    NEW.statut := 'en_relecture';
    NEW.publie := false;
    NEW.propose_par := NULL;
    NEW.motif_refus := NULL;
    NEW.propose_par_nom := public.pds_txt(NEW.propose_par_nom, 120, 'Proposé par');
    NEW.created_at := now();
    RETURN NEW;
  END IF;

  IF mail = '' OR NOT public.membre_a_jour(mail) THEN
    RAISE EXCEPTION 'Seuls les membres à jour de cotisation peuvent proposer un événement.' USING ERRCODE = 'P0001';
  END IF;
  SELECT p.id, p.prenom, p.nom, p.nom_podcast INTO fiche FROM public.podcasts p
    WHERE lower(p.email) = mail ORDER BY (p.type_profil = 'podcasteur'), p.created_at LIMIT 1;
  IF fiche.id IS NULL THEN
    RAISE EXCEPTION 'Aucune fiche n''est liée à votre adresse.' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT count(*) FROM public.evenements_proposeurs ep WHERE lower(ep.email) = mail AND ep.created_at > now() - interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'Vous avez proposé 5 événements aujourd''hui. Réessayez demain.' USING ERRCODE = 'P0001', HINT = 'rate_limit';
  END IF;
  NEW := public.pds_evenement_champs(NEW);
  IF NEW.date_debut < now() - interval '1 day' OR NEW.date_debut > now() + interval '3 years' THEN
    RAISE EXCEPTION 'Date de début invalide.' USING ERRCODE = 'P0001';
  END IF;
  NEW.statut := 'en_relecture';
  NEW.publie := false;
  NEW.origine := 'membre';
  NEW.propose_par := fiche.id;
  NEW.propose_par_nom := coalesce(nullif(trim(coalesce(fiche.prenom, '') || ' ' || coalesce(fiche.nom, '')), ''), fiche.nom_podcast);
  NEW.motif_refus := NULL;
  NEW.inscription_activee := false;
  NEW.podcasts_invites := '[]'::jsonb;
  NEW.structure_id := NULL;
  NEW.faq := NULL;
  NEW.created_at := now();
  RETURN NEW;
END $function$;

REVOKE EXECUTE ON FUNCTION public.guard_evenements() FROM PUBLIC, anon, authenticated;