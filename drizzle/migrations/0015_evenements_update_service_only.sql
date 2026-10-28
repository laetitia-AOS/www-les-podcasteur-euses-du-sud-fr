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
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END $function$;