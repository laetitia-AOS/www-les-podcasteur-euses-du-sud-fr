# Règles des fonctions serveur

- `sync-episodes` est la seule à écrire dans `episodes` (tâche planifiée toutes les 6 h, une lecture au plus toutes les 5 h 30 via `demarrer_sync_episodes`). Toute lecture de flux passe par `_shared/flux.ts` (https public seulement, 8 s, 5 Mo), pour que personne ne puisse détourner le serveur. `podcast-episodes` ne sert plus qu'à la version publiée précédente.
- `helloasso-webhook` relit chaque commande chez HelloAsso (`_shared/helloasso.ts`) et n'enregistre jamais tel quel le contenu reçu. Si HelloAsso refuse la lecture, le paiement est enregistré `a_verifier` et n'active rien tant qu'un·e admin ne l'a pas validé. La `formule` vient de la formule réellement payée.
- `envoi-image` reçoit les images des visiteur·ices non connecté·es : contrôle du type réel, du poids et d'une limite par adresse, rangement dans le dossier privé `images-en-attente`. Elles ne deviennent publiques qu'avec `valider-images`, appelée quand un·e admin valide une fiche ou publie un événement.
- `contact-membre` est la seule à écrire dans la boîte `contact_requests` (une insertion groupée = un envoi), et seulement vers des fiches `podcast_visible`.
- `demande-devis` choisit elle-même les studios destinataires, enregistre la demande dans `demandes_devis` et une ligne `contact_requests` de type devis par studio.
- `compter-stat` est la seule à écrire les chiffres, via `compter_stat`. L'empreinte combine le sel secret `STATS_SEL`, le jour et l'IP ; l'IP n'est jamais gardée en clair et les empreintes sont effacées sous 48 h.
- `supprimer-mes-donnees` lit l'adresse dans la session, jamais dans la requête, puis appelle `effacer_donnees_membre`. Les paiements sont anonymisés, jamais supprimés.
- `sitemap-evenements` sert le plan du site des événements publiés (déclaré dans `robots.txt`).
