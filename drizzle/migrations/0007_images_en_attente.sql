CREATE TABLE public.images_en_attente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot uuid NOT NULL,
  email text NOT NULL,
  bucket_cible text NOT NULL CHECK (bucket_cible IN ('podcast-thumbnails','studio-galleries','event-images')),
  chemin text NOT NULL,
  type_mime text NOT NULL CHECK (type_mime IN ('image/jpeg','image/png','image/webp')),
  taille integer NOT NULL CHECK (taille > 0 AND taille <= 5242880),
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente','validee','refusee')),
  created_at timestamptz NOT NULL DEFAULT now(),
  traite_at timestamptz,
  UNIQUE (bucket_cible, chemin)
);
CREATE INDEX images_en_attente_email_idx ON public.images_en_attente (lower(email), created_at);
GRANT SELECT, UPDATE, DELETE ON public.images_en_attente TO authenticated;
GRANT ALL ON public.images_en_attente TO service_role;
ALTER TABLE public.images_en_attente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read pending images" ON public.images_en_attente FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update pending images" ON public.images_en_attente FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete pending images" ON public.images_en_attente FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Plus d'envoi direct d'images par un·e visiteur·ice : uniquement via la fonction de contrôle.
DROP POLICY IF EXISTS "Anyone can upload podcast thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public upload studio galleries" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload event images" ON storage.objects;

-- Dossier privé des images en attente : lecture et gestion par les admins seulement.
CREATE POLICY "Admins manage pending images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'images-en-attente' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'images-en-attente' AND public.has_role(auth.uid(), 'admin'));

-- Une fiche envoyée sans connexion n'est plus validée automatiquement sur la seule foi de l'e-mail saisi :
-- il faut être connecté·e avec cette adresse (ou admin). Le paiement HelloAsso vérifié valide toujours la fiche.
CREATE OR REPLACE FUNCTION public.auto_validate_podcast_on_insert()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  NEW.valide := false;
  IF NEW.email IS NOT NULL AND NEW.email <> ''
     AND (lower(coalesce(auth.jwt() ->> 'email', '')) = lower(NEW.email) OR public.has_role(auth.uid(), 'admin'))
     AND NEW.vignette_url IS NOT NULL AND NEW.vignette_url <> ''
     AND NEW.nom_podcast IS NOT NULL AND length(NEW.nom_podcast) >= 3
     AND NEW.description IS NOT NULL AND length(NEW.description) >= 20
     AND NEW.thematique IS NOT NULL AND NEW.thematique <> ''
     AND NEW.lien_ecoute IS NOT NULL
     AND NEW.lien_ecoute ~ '^https?://(www\.)?(open\.spotify\.com|podcasters\.spotify\.com|podcasts\.apple\.com|music\.amazon\.com|amazon\.com|deezer\.com|youtube\.com|youtu\.be|soundcloud\.com|podcloud\.fr|ausha\.co|acast\.com|anchor\.fm|spreaker\.com|podbean\.com|castbox\.fm|overcast\.fm|pocketcasts\.com|listen\.pocketcasts\.com|pod\.link|smartlink\.|linktr\.ee|bfrn\.co|feeds\.buzzsprout\.com|buzzsprout\.com|simplecast\.com|transistor\.fm|captivate\.fm|megaphone\.fm|omnystudio\.com|audiomeans\.fr|podcastics\.com|rfrn\.co|radiofrance\.fr|arte\.tv|radiomeuh\.com|luminary\.link|stitcher\.com|tunein\.com|iheart\.com|pandora\.com|player\.fm|castro\.fm|fountain\.fm|goodpods\.com)/'
  THEN
    IF EXISTS (SELECT 1 FROM public.adhesions WHERE lower(email) = lower(NEW.email) AND statut = 'active') THEN
      NEW.valide := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;