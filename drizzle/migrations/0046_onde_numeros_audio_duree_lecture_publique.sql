-- La durée du MP3 d'un numéro (ajoutée au lot 4) doit être lisible par les visiteur·ices, comme les autres
-- colonnes publiques : sans ce droit, la page /onde ne pouvait plus charger les numéros sans connexion.
GRANT SELECT (audio_duree) ON public.onde_numeros TO anon;