ALTER TABLE public.flux_etat ADD COLUMN IF NOT EXISTS flux_url text;
ALTER TABLE public.flux_etat ADD COLUMN IF NOT EXISTS flux_titre text;
ALTER TABLE public.flux_etat ADD COLUMN IF NOT EXISTS flux_auteur text;
ALTER TABLE public.flux_etat ADD COLUMN IF NOT EXISTS confirmation text NOT NULL DEFAULT 'a_confirmer';
ALTER TABLE public.flux_etat ADD COLUMN IF NOT EXISTS confirme_le timestamptz;
ALTER TABLE public.flux_etat ADD COLUMN IF NOT EXISTS confirme_par uuid;

-- Un flux saisi par le membre est confirmé d'office
UPDATE public.flux_etat SET confirmation = 'confirme' WHERE source = 'flux saisi';

ALTER TABLE public.flux_etat ADD CONSTRAINT flux_etat_confirmation_check CHECK (confirmation IN ('a_confirmer', 'confirme', 'refuse'));

-- Épisodes publics : fiche visible ET flux confirmé (saisi par le membre ou validé par un·e admin)
CREATE OR REPLACE FUNCTION public.episodes_visibles(_podcast_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.podcast_visible(_podcast_id)
    AND EXISTS (SELECT 1 FROM public.flux_etat f WHERE f.podcast_id = _podcast_id AND f.confirmation = 'confirme')
$function$;

DROP FUNCTION IF EXISTS public.mes_flux();
CREATE FUNCTION public.mes_flux()
 RETURNS TABLE(podcast_id uuid, statut text, message text, nb_episodes integer, derniere_lecture timestamptz, source text, confirmation text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT f.podcast_id, f.statut, f.message, f.nb_episodes, f.derniere_lecture, f.source, f.confirmation
  FROM public.flux_etat f JOIN public.podcasts p ON p.id = f.podcast_id
  WHERE coalesce(auth.jwt() ->> 'email', '') <> '' AND lower(p.email) = lower(auth.jwt() ->> 'email')
$function$;
REVOKE ALL ON FUNCTION public.mes_flux() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mes_flux() TO authenticated, service_role;

-- Liste des flux pour l'administration (vide hors admin)
CREATE OR REPLACE FUNCTION public.admin_flux()
 RETURNS TABLE(podcast_id uuid, nom_podcast text, porteur text, lien_ecoute text, source text, statut text, message text,
   flux_url text, flux_titre text, flux_auteur text, confirmation text, nb_episodes integer, derniere_lecture timestamptz, confirme_le timestamptz)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT f.podcast_id, p.nom_podcast, nullif(trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')), ''), p.lien_ecoute,
    f.source, f.statut, f.message, f.flux_url, f.flux_titre, f.flux_auteur, f.confirmation, f.nb_episodes, f.derniere_lecture, f.confirme_le
  FROM public.flux_etat f JOIN public.podcasts p ON p.id = f.podcast_id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY (f.confirmation = 'a_confirmer' AND f.flux_url IS NOT NULL) DESC, p.nom_podcast
$function$;
REVOKE ALL ON FUNCTION public.admin_flux() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_flux() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.confirmer_flux(_podcast_id uuid, _decision text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Réservé aux administrateur·ices.' USING ERRCODE = '42501';
  END IF;
  IF _decision NOT IN ('confirme', 'refuse', 'a_confirmer') THEN
    RAISE EXCEPTION 'Décision invalide.' USING ERRCODE = 'P0001';
  END IF;
  UPDATE public.flux_etat SET confirmation = _decision,
    confirme_le = CASE WHEN _decision = 'a_confirmer' THEN NULL ELSE now() END,
    confirme_par = CASE WHEN _decision = 'a_confirmer' THEN NULL ELSE auth.uid() END
  WHERE podcast_id = _podcast_id AND flux_url IS NOT NULL;
  RETURN FOUND;
END $function$;
REVOKE ALL ON FUNCTION public.confirmer_flux(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirmer_flux(uuid, text) TO authenticated, service_role;