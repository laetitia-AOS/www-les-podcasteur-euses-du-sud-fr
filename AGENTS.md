# Règles techniques du projet

Certains dossiers ont leur propre `AGENTS.md` (par exemple `supabase/functions/`) : lisez-le avant de modifier un fichier de ce dossier.

- **Couleurs et polices :** uniquement via les variables de `src/index.css` (préfixe `--pds-`) et `tailwind.config.ts`. Les anciennes variables (tc, bleu, ink…) sont des alias, à garder tant que des pages non refondues les utilisent.
- **Styles partagés :** boutons, conteneur et mises en forme (noms, villes, durées, dates) sont dans `src/lib/pds.ts`. Réutilisez-les plutôt que de les recopier.
- **Épisodes :** le site les lit via `src/lib/episodes.ts`. Ils ne sont publics que si le flux est confirmé (`episodes_visibles`). Les messages sur l'état d'un flux viennent de `messageFlux` (`src/lib/flux.ts`).
- **Lecteur audio :** contexte global (`PlayerProvider` dans App), avec la barre `PlayerBar` hors des routes, pour que l'écoute continue pendant la navigation.
- **Accueil :** les sections sont dans `src/components/home/`, chacune autonome et alimentée par `useHomeData.ts`.
- **Inscription :** sur la page Adhérer. Étapes dans `src/components/adherer/` ; listes, tarifs, consignes HelloAsso et envoi d'images dans `src/lib/inscription.ts`. Une personne = une ligne `podcasts` par podcast, avec le même profil et le même e-mail.
- **Photos :** la photo de profil est `photo_profil_url`, la pochette du podcast est `vignette_url`. L'annuaire passe toujours par `profilePhotoFor`.
- **Espace membre :** `src/pages/MonPodcast.tsx`, blocs dans `src/components/espace-membre/`. Il lit tout par des fonctions limitées à l'e-mail connecté : `mon_adhesion`, `mes_demandes`, `mes_evenements`, `mes_stats`. Un paiement fait sous un autre nom est relié au membre par `adhesion_rattachements` (écriture admin seulement).
- **Formulaires publics :** vérifiés, nettoyés et limités à 5 envois par heure et par adresse par les déclencheurs `guard_*` en base. Les pages affichent le motif du refus via `messageServeur`.
- **Adhésions :** seuls le webhook HelloAsso et les admins y écrivent. L'année couverte (`annee`, calculée par le déclencheur `adhesion_echeance`) et la `formule` font foi. `membre_a_jour` (= `membre_a_jour_le` à la date du jour) applique les règles de validité et de tolérance sans tâche programmée. Côté site, l'affichage passe par les fonctions de `src/lib/espaceMembre.ts`.
- **Fiche publique :** seulement si `podcast_visible(id)` est vrai : fiche validée + membre à jour, ou sursis `visible_sans_adhesion` (admin seulement, via `sursis_adhesion`). La règle de lecture publique de `podcasts`, `episodes_visibles` et `lieu_visible` passent par elle. Un membre ne modifie jamais `valide`, `email` ni `created_at` de sa fiche (`guard_podcasts_update`).
- **Exports tableur :** toujours par `toCsv` (`src/lib/csv.ts`), qui neutralise les formules.
- **Images :** un·e visiteur·ice non connecté·e passe toujours par `uploadImages` et la fonction `envoi-image`. Une personne connectée écrit dans son propre dossier.
- **« Je cherche / J'apporte » :** des codes (`cherche_choix`, `apporte_choix`, liste `COLLAB_CHOIX`, vérifiés par `guard_podcasts_collab`), plus une précision libre. Les anciennes colonnes `cherche_collaboration` et `peut_apporter` sont des archives. L'annuaire filtre sur `apporte_choix`.
- **Boîte de réception :** messages, devis et collabs sont dans `contact_requests`, lus via `mes_demandes` et `marquer_demande_lue`. Ni visiteur·ice ni membre n'accède directement à la table.
- **Studios et structures :** leurs détails sont dans `fiches_lieux` (sans e-mail, `guard_fiches_lieux`). Un seul formulaire : `src/components/studios/LieuEditor.tsx`. Les pages publiques lisent seulement `LIEU_COLUMNS`.
- **Agenda :** `evenements.statut` fait foi ; `publie` n'en est qu'une copie. Seuls les membres à jour proposent un événement, et seul un admin change le statut. L'auteur·ice est enregistré·e à part, dans `evenements_proposeurs`.
  - Côté site, l'enregistrement d'une proposition ne doit pas demander la ligne en retour.
  - Les « Je viens » vont dans `evenement_inscriptions`. Le public ne voit que le nombre (`nb_venues`) ; l'organisateur·ice voit la liste (`mes_venues`).
- **Chiffres des membres :** côté site, appelez `compterStat` (`src/lib/stats.ts`).
- **Administration :** chaque page admin s'affiche dans `AdminLayout` (vérification admin + menu), une rubrique par domaine (`/admin`, `/admin/membres`, `/admin/annuaire`, `/admin/agenda`, `/admin/messages`), découpée en onglets lus dans l'adresse (`?onglet=`, `AdminOnglets`), pour que les liens et le retour arrière mènent au bon endroit. Les compteurs « À traiter » viennent de `admin_a_traiter()` ; la liste des membres de `admin_membres()`. Ces deux fonctions ne renvoient rien à qui n'est pas admin.
- **Partage d'événement :** toujours l'adresse publique `/agenda/:slug` (jamais une adresse de fonction serveur : elles répondent en texte brut). Texte et vignettes (paysage 1200×630, carrée 1080×1080) sont fabriqués dans le navigateur par `src/lib/partageEvenement.ts`. Dates et heures des événements à l'heure de Paris.
