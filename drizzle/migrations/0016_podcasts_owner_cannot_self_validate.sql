CREATE OR REPLACE FUNCTION public.guard_podcasts_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admins et traitements internes du serveur (validation à l'adhésion) gardent la main.
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  -- Un membre ne peut ni publier lui-même sa fiche, ni la déplacer vers une autre adresse.
  NEW.valide := OLD.valide;
  NEW.email := OLD.email;
  NEW.created_at := OLD.created_at;
  NEW.consent_contact := NEW.consent_contact;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_00b_guard_podcasts_update ON public.podcasts;
CREATE TRIGGER trg_00b_guard_podcasts_update
  BEFORE UPDATE ON public.podcasts
  FOR EACH ROW EXECUTE FUNCTION public.guard_podcasts_update();