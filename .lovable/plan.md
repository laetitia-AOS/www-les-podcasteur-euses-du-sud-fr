# Refonte de l'administration

Aujourd'hui : 4 cartes d'accueil, puis des pages très longues où les outils sont empilés (la page Annuaire contient les images à valider, les fiches à compléter, les flux, la liste et l'éditeur). Certains outils sont mal rangés : la liste des membres est cachée dans « Adhésions », les messages aux membres dans « Contacts ». Il n'existe aucune vue de ce qui attend une action.

## Nouvelle organisation

```text
+----------------------+------------------------------------------+
| ADMINISTRATION       |  À traiter                               |
|                      |  [3 images à valider] [2 propositions]   |
| > À traiter          |  [1 paiement à vérifier] [4 messages]    |
|   Membres            |                                          |
|   Annuaire           |  Raccourcis : nouvel événement,          |
|   Agenda             |  relance collective, export membres      |
|   Messages           |                                          |
|                      |                                          |
|   Voir le site       |                                          |
|   Déconnexion        |                                          |
+----------------------+------------------------------------------+
```

Un menu fixe à gauche (il devient un menu déroulant sur téléphone), le même sur toutes les pages. Chaque rubrique est découpée en onglets, avec une seule tâche par onglet.

1. **À traiter** (accueil) : une case par chose en attente, avec son nombre. Un clic ouvre directement le bon onglet.
   - images envoyées sans connexion ;
   - fiches à valider ;
   - propositions d'événements en relecture ;
   - paiements « à vérifier sur HelloAsso » ;
   - messages et devis non lus ou non transmis ;
   - flux d'épisodes à confirmer.
2. **Membres**
   - Membres : la liste, avec les statuts, le sursis, l'export et l'écriture à un·e membre.
   - Paiements HelloAsso : les adhésions par année, la validation et le rattachement d'un paiement fait sous un autre nom.
   - Relances : la relance collective de renouvellement.
3. **Annuaire**
   - Fiches : la liste avec filtres par type, et une fiche qui s'ouvre dans un panneau à droite pour la modifier.
   - À valider : les fiches et les images en attente.
   - Fiches à compléter : la relance individuelle (photo, pochette, flux, Je cherche / J'apporte).
   - Flux d'épisodes : l'état des flux et leur confirmation.
4. **Agenda**
   - En relecture : les propositions des membres, avec Publier / Refuser.
   - À venir et Archives : les événements, et le bouton « Nouvel événement ».
   - Inscriptions : les « Je viens » par événement, avec l'export.
5. **Messages**
   - Formulaire de contact du site.
   - Messages, collabs et devis envoyés aux membres.

## Ce qui ne change pas

- Toutes les actions actuelles restent possibles, avec les mêmes règles : réservé aux admins et vérifié côté serveur.
- Aucune donnée n'est déplacée ni modifiée.
- Les anciennes adresses (`/admin/podcasts`, `/admin/adhesions`…) renvoient vers la nouvelle rubrique correspondante.
- Le style reste celui du site : bleu, orange, angles droits, Archivo et IBM Plex Mono, focus clavier visible, animations réduites si on le demande.

## Vérifications

- Parcours complet avec un compte admin de test fictif : chaque case « À traiter » mène au bon onglet, et chaque action existante fonctionne toujours (valider une fiche, publier un événement, valider un paiement, relancer).
- Affichage ordinateur et téléphone.
- Un compte non admin ne voit rien.

## Détails techniques

- `src/components/admin/AdminLayout.tsx` : barre latérale et garde admin (`useAdminAuth`), un seul endroit au lieu de cinq copies.
- Routes `/admin`, `/admin/membres`, `/admin/annuaire`, `/admin/agenda`, `/admin/messages`. L'onglet est dans l'adresse (`?onglet=`), pour que les liens de « À traiter » et le bouton retour du navigateur fonctionnent.
- Une fonction serveur réservée aux admins, `admin_a_traiter()`, renvoie les compteurs en une seule lecture.
- Les pages actuelles sont découpées en blocs dans `src/components/admin/` : la logique existante est réutilisée telle quelle, sans être réécrite. `AdminPodcasts.tsx` (974 lignes) est scindé en liste, éditeur et validation.
- Mise à jour du `AGENTS.md` racine : règle « administration = AdminLayout + une rubrique par domaine ».
