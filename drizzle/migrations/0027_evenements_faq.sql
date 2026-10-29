ALTER TABLE public.evenements ADD COLUMN IF NOT EXISTS faq jsonb;
COMMENT ON COLUMN public.evenements.faq IS 'Questions fréquentes de la page événement [{q, r}], écrites par un admin seulement. Vide : réponses par défaut du site.';

CREATE OR REPLACE FUNCTION public.guard_evenements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE mail text := lower(coalesce(auth.jwt() ->> 'email', '')); fiche record;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    NEW.publie := (NEW.statut = 'publie');
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

CREATE OR REPLACE FUNCTION public.guard_evenements_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  IF public.has_role(auth.uid(), 'admin') THEN
    IF NEW.statut IS NOT DISTINCT FROM OLD.statut AND NEW.publie IS DISTINCT FROM OLD.publie THEN
      NEW.statut := CASE WHEN NEW.publie THEN 'publie' ELSE 'en_relecture' END;
    END IF;
    NEW.publie := (NEW.statut = 'publie');
    IF NEW.statut <> 'refuse' THEN NEW.motif_refus := NULL; END IF;
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL THEN
    -- Seuls les appels internes du serveur passent sans compte ; le statut ne change jamais
    IF coalesce(auth.role(), '') <> 'service_role' AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
      RAISE EXCEPTION 'Modification non autorisée.' USING ERRCODE = '42501';
    END IF;
    NEW.statut := OLD.statut; NEW.publie := OLD.publie; NEW.motif_refus := OLD.motif_refus;
    RETURN NEW;
  END IF;
  IF OLD.statut <> 'en_relecture' OR NOT public.mon_evenement(OLD.id) THEN
    RAISE EXCEPTION 'Cette proposition ne peut plus être modifiée.' USING ERRCODE = 'P0001';
  END IF;
  NEW := public.pds_evenement_champs(NEW);
  NEW.statut := OLD.statut;
  NEW.publie := OLD.publie;
  NEW.origine := OLD.origine;
  NEW.propose_par := OLD.propose_par;
  NEW.propose_par_nom := OLD.propose_par_nom;
  NEW.motif_refus := OLD.motif_refus;
  NEW.inscription_activee := OLD.inscription_activee;
  NEW.podcasts_invites := OLD.podcasts_invites;
  NEW.structure_id := OLD.structure_id;
  NEW.faq := OLD.faq;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END $function$;