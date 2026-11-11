-- Avis et notes laissés sous la fiche d'un podcast.
-- Écriture uniquement par la fonction serveur « avis-podcast » ; lecture publique des avis publiés ; modération par les admin·es.

CREATE TABLE public.avis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  podcast_id uuid NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  nom text NOT NULL,
  email text NOT NULL,
  note smallint NOT NULL,
  commentaire text NOT NULL,
  statut text NOT NULL DEFAULT 'publie',
  signale boolean NOT NULL DEFAULT false,
  motif_signalement text,
  membre boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT avis_pkey PRIMARY KEY (id),
  CONSTRAINT avis_note_entre_1_et_5 CHECK (note BETWEEN 1 AND 5),
  CONSTRAINT avis_statut_valide CHECK (statut IN ('publie', 'masque'))
);

COMMENT ON TABLE public.avis IS 'Notes et commentaires laissés sous une fiche de podcast. Publication immédiate, modération admin.';

GRANT SELECT ON public.avis TO anon;
GRANT SELECT, UPDATE, DELETE ON public.avis TO authenticated;
GRANT ALL ON public.avis TO service_role;

ALTER TABLE public.avis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avis publiés visibles par tous"
  ON public.avis FOR SELECT TO anon, authenticated
  USING (statut = 'publie');

CREATE POLICY "Admins lisent tous les avis"
  ON public.avis FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins modifient les avis"
  ON public.avis FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins suppriment les avis"
  ON public.avis FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Vérification, nettoyage et limites côté serveur, quel que soit le rôle qui écrit.
CREATE OR REPLACE FUNCTION public.guard_avis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE est_auteur boolean;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;

  NEW.nom := public.pds_txt(NEW.nom, 100, 'Nom', true);
  NEW.email := public.pds_email(NEW.email);
  NEW.commentaire := public.pds_txt(NEW.commentaire, 600, 'Commentaire', true);
  IF NEW.commentaire IS NULL OR char_length(NEW.commentaire) < 10 THEN
    RAISE EXCEPTION 'Votre commentaire doit faire au moins 10 caractères.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.note IS NULL OR NEW.note < 1 OR NEW.note > 5 THEN
    RAISE EXCEPTION 'Choisissez une note de 1 à 5 étoiles.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.podcast_visible(NEW.podcast_id) THEN
    RAISE EXCEPTION 'Ce podcast n''est pas visible sur le site.' USING ERRCODE = 'P0001';
  END IF;

  SELECT lower(p.email) = NEW.email INTO est_auteur FROM public.podcasts p WHERE p.id = NEW.podcast_id;
  IF coalesce(est_auteur, false) THEN
    RAISE EXCEPTION 'Vous ne pouvez pas noter votre propre podcast.' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (SELECT 1 FROM public.avis a WHERE a.podcast_id = NEW.podcast_id AND lower(a.email) = NEW.email) THEN
    RAISE EXCEPTION 'Vous avez déjà laissé un avis sur ce podcast.' USING ERRCODE = 'P0001';
  END IF;

  IF (SELECT count(*) FROM public.avis a WHERE lower(a.email) = NEW.email AND a.created_at > now() - interval '1 hour') >= 5 THEN
    PERFORM public.pds_trop_d_envois();
  END IF;

  NEW.statut := 'publie';
  NEW.signale := false;
  NEW.motif_signalement := NULL;
  NEW.created_at := now();
  NEW.membre := coalesce(public.membre_a_jour(NEW.email), false);
  RETURN NEW;
END $function$;

CREATE TRIGGER avis_guard
  BEFORE INSERT ON public.avis
  FOR EACH ROW EXECUTE FUNCTION public.guard_avis();

CREATE INDEX avis_podcast_idx ON public.avis (podcast_id, statut, created_at DESC);
CREATE INDEX avis_email_idx ON public.avis (lower(email), created_at DESC);