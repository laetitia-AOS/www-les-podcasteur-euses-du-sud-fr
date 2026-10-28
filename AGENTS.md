# Règles techniques du projet

- Les couleurs et polices passent uniquement par les variables de `src/index.css` (préfixe `--pds-`) et `tailwind.config.ts` ; les anciennes variables (tc, bleu, ink…) sont des alias à garder tant que des pages non refondues les utilisent.
- Les classes partagées des boutons, du conteneur et des fonctions de mise en forme (noms, villes, durées, dates) vivent dans `src/lib/pds.ts` : les réutiliser plutôt que les recopier, pour garder un style identique d'une page à l'autre.
- Les épisodes viennent de la fonction `podcast-episodes`, qui lit les flux RSS à la volée (flux_rss, sinon Apple, Ausha ou recherche Apple sur le nom exact) sans rien écrire en base, pour ne jamais modifier les données des fiches.
- Le lecteur audio est un contexte global (`PlayerProvider` dans App) avec la barre `PlayerBar` hors des routes, pour que l'écoute continue pendant la navigation.
- Les sections de l'accueil sont dans `src/components/home/`, chacune autonome et alimentée par `useHomeData.ts`.
