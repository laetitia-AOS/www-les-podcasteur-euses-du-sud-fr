-- Une adhésion « à vérifier » ne rend aucune fiche visible tant qu'un·e admin ne l'a pas passée en « active ».
CREATE OR REPLACE FUNCTION public.auto_validate_podcast_on_adhesion()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.statut = 'active' AND NEW.email IS NOT NULL AND NEW.email <> ''
     AND (TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM 'active') THEN
    UPDATE public.podcasts
    SET valide = true
    WHERE lower(email) = lower(NEW.email)
      AND valide = false
      AND vignette_url IS NOT NULL AND vignette_url <> ''
      AND nom_podcast IS NOT NULL AND length(nom_podcast) >= 3
      AND description IS NOT NULL AND length(description) >= 20
      AND thematique IS NOT NULL AND thematique <> ''
      AND lien_ecoute ~ '^https?://(www\.)?(open\.spotify\.com|podcasters\.spotify\.com|podcasts\.apple\.com|music\.amazon\.com|amazon\.com|deezer\.com|youtube\.com|youtu\.be|soundcloud\.com|podcloud\.fr|ausha\.co|acast\.com|anchor\.fm|spreaker\.com|podbean\.com|castbox\.fm|overcast\.fm|pocketcasts\.com|listen\.pocketcasts\.com|pod\.link|smartlink\.|linktr\.ee|bfrn\.co|feeds\.buzzsprout\.com|buzzsprout\.com|simplecast\.com|transistor\.fm|captivate\.fm|megaphone\.fm|omnystudio\.com|audiomeans\.fr|podcastics\.com|rfrn\.co|radiofrance\.fr|arte\.tv|radiomeuh\.com|luminary\.link|stitcher\.com|tunein\.com|iheart\.com|pandora\.com|player\.fm|castro\.fm|fountain\.fm|goodpods\.com)/';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_auto_validate_podcast_on_adhesion ON public.adhesions;
CREATE TRIGGER trg_auto_validate_podcast_on_adhesion BEFORE INSERT OR UPDATE OF statut ON public.adhesions
  FOR EACH ROW EXECUTE FUNCTION public.auto_validate_podcast_on_adhesion();

CREATE OR REPLACE FUNCTION public.mon_adhesion()
 RETURNS TABLE(date_adhesion timestamp with time zone, type_adhesion text, statut text, montant numeric)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT a.date_adhesion, a.type_adhesion, a.statut, a.montant
  FROM public.adhesions a
  WHERE coalesce(auth.jwt() ->> 'email', '') <> ''
    AND a.statut = 'active'
    AND (
      lower(a.email) = lower(auth.jwt() ->> 'email')
      OR a.id IN (
        SELECT r.adhesion_id FROM public.adhesion_rattachements r
        WHERE r.email_membre = lower(auth.jwt() ->> 'email')
      )
    )
  ORDER BY a.date_adhesion DESC NULLS LAST
  LIMIT 1
$function$;