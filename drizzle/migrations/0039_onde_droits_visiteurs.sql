-- L'Onde du Sud : les visiteur·ices ne lisent que les colonnes utiles à la page publique
-- (les droits par défaut du schéma donnaient tout ; les identifiants des auteur·ices restent réservés à l'équipe).
REVOKE ALL ON public.onde_numeros FROM anon;
GRANT SELECT (id, numero, mois, titre, chapeau, slug, couverture_url, couverture_alt, audio_url, audio_voix, blocs, statut, publie_le, updated_at)
  ON public.onde_numeros TO anon;