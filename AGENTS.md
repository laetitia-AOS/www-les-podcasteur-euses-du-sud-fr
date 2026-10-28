# Règles techniques du projet

- Les couleurs et polices passent uniquement par les variables de `src/index.css` (préfixe `--pds-`) et `tailwind.config.ts` ; les anciennes variables (tc, bleu, ink…) sont des alias à garder tant que des pages non refondues les utilisent.
- Les classes partagées des boutons, du conteneur et des fonctions de mise en forme (noms, villes, durées, dates) vivent dans `src/lib/pds.ts` : les réutiliser plutôt que les recopier, pour garder un style identique d'une page à l'autre.
- Les épisodes viennent de la fonction `podcast-episodes`, qui lit les flux RSS à la volée (flux_rss, sinon Apple, Ausha ou recherche Apple sur le nom exact) sans rien écrire en base, pour ne jamais modifier les données des fiches.
- Le lecteur audio est un contexte global (`PlayerProvider` dans App) avec la barre `PlayerBar` hors des routes, pour que l'écoute continue pendant la navigation.
- Les sections de l'accueil sont dans `src/components/home/`, chacune autonome et alimentée par `useHomeData.ts`.
- L'inscription vit sur la page Adhérer : étapes dans `src/components/adherer/`, listes, tarifs et envoi d'images dans `src/lib/inscription.ts`. Une personne = une ligne `podcasts` par podcast (mêmes infos de profil et même e-mail), pour garder la base existante intacte.
- La photo de profil d'une personne est `photo_profil_url` ; `vignette_url` reste la pochette du podcast (ou la photo pour les fiches sans podcast). L'annuaire passe par `profilePhotoFor`, jamais directement par la pochette.
- L'espace membre (`src/pages/MonPodcast.tsx`, blocs dans `src/components/espace-membre/`) lit l'adhésion, les messages reçus et les événements proposés via les fonctions `mon_adhesion`, `mes_demandes`, `mes_evenements` (limitées à l'e-mail connecté), pour ne pas modifier les règles d'accès de ces tables.
