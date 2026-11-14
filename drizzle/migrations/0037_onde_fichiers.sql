-- L'Onde du Sud : fichiers dans l'espace de stockage privé « onde ».
-- Dépôt uniquement par la fonction serveur « onde-fichier » (admins et éditeur·ices, type et poids vérifiés).
-- Lecture publique uniquement via la fonction « onde-media », et seulement pour les numéros publiés.
-- L'équipe de L'Onde lit tous les fichiers (aperçu des brouillons).

CREATE POLICY "Équipe de L'Onde lit les fichiers"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'onde' AND public.peut_editer_onde());

-- Adresse d'un fichier : servie par la fonction « onde-media » (dossier = identifiant du numéro).
CREATE OR REPLACE FUNCTION public.onde_fichier(v text, label text, required boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE s text := public.pds_txt(v, 600, label, required);
BEGIN
  IF s IS NOT NULL AND s !~ '^https://[a-z0-9-]+\.supabase\.co/functions/v1/onde-media/[0-9a-f-]{36}/[A-Za-z0-9_-]+\.(jpg|png|webp|mp3)$' THEN
    RAISE EXCEPTION 'Le fichier « % » doit être envoyé depuis l''éditeur de L''Onde.', label USING ERRCODE = 'P0001';
  END IF;
  RETURN s;
END $$;

-- Lien non sûr dans un texte (javascript:, data:…) : remplacé par son seul texte, parenthèses comprises.
CREATE OR REPLACE FUNCTION public.onde_texte_riche(v text, maxlen integer, label text, required boolean DEFAULT false)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE s text := public.onde_txt(v, maxlen, label, required);
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  RETURN regexp_replace(s, '\[([^\]]*)\]\(\s*(?!https?://|/[^/])[^\s]*\)', '\1', 'g');
END $$;