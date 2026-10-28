# Agenda : propositions des membres, relecture, « Je viens »

## Avant de commencer
- **E-mails :** aucun domaine d'envoi n'est encore configuré. Tant qu'il ne l'est pas, le statut est visible dans l'espace membre. Les e-mails « publié » et « refusé » partiront dès que le domaine sera configuré, avec les e-mails intégrés de Lovable uniquement.
- **Aujourd'hui :** 8 événements, tous publiés, dont 6 passés, et 16 inscriptions sur 3 événements. Rien n'est effacé.
- **Changement visible :** les visiteurs non connectés ne pourront plus proposer d'événement, seulement les membres à jour.

## 1. Données

### Table des événements : nouveaux champs
| Champ | Contenu |
|---|---|
| origine | « pds » (organisé par l'association) ou « membre » |
| propose_par | fiche du membre qui propose (son nom s'affiche, jamais son e-mail) |
| type | apéro écoute, atelier, live, écoute, rencontre, autre |
| format | sur place ou en ligne |
| lien_connexion | lien https, pour un événement en ligne |
| tarif | texte court, 80 caractères (« 5 € », « Prix libre », « Adhérent·es : 0 € ») |
| statut | en relecture, publié ou refusé |
| motif_refus | texte de l'équipe, visible seulement par le membre concerné |

- **Champs déjà là, gardés :** titre, description, dates, lieu, adresse, lien d'inscription externe, visuel, nombre de places.
- **Reprise des événements existants :**
  - tous passent en « publié » et « organisé par PDS » ;
  - les 2 proposés par le formulaire public deviennent « proposé par un membre » quand l'adresse correspond à une fiche ;
  - types : atelier et rencontre restent ; « événement » et « partenaire » deviennent « autre ».
- **Ancien interrupteur « publié » :** il reste, recalculé automatiquement à partir du statut. Le site déjà en ligne et l'aperçu de partage continuent de marcher.
- **Archives :** un événement passe dans les archives dès que sa date de fin (ou de début) est passée. C'est calculé à l'affichage, sans tâche planifiée.

### Nouvelle table `evenements_proposeurs` (privée)
- Champs : événement, e-mail du membre, date.
- Elle sert à savoir à qui appartient une proposition sans mettre l'e-mail dans la table publique des événements.
- Accès : le membre concerné et les admins. Les écritures se font uniquement côté serveur.

### « Je viens » : la table des inscriptions existante est réutilisée
- **Changements :** ajout d'un champ « compte » (vide pour un visiteur). Téléphone et structure deviennent inutiles pour « Je viens », mais restent en base pour les 16 inscriptions existantes.
- **Membre connecté :** un clic, avec son nom et son e-mail repris de son compte.
- **Visiteur :** nom et e-mail.
- **Contrôle :** une seule venue par adresse et par événement, 5 par heure et par adresse comme aujourd'hui, et seulement pour un événement publié et à venir. Si un nombre de places est indiqué, « Complet » s'affiche une fois atteint.
- **Fonction publique `nb_venues` :** elle renvoie seulement le nombre, jamais les noms.
- **Fonction `mes_venues` :** l'organisateur, le membre qui a proposé l'événement, voit la liste des noms et e-mails dans son espace. Les admins voient tout.

## 2. Règles d'accès (appliquées côté serveur)
- **Lire :**
  - tout le monde lit les événements publiés ;
  - un membre voit aussi ses propres propositions, quel que soit leur statut ;
  - les admins voient tout.
- **Proposer :** uniquement un membre connecté et à jour de cotisation. La base force « en relecture » et « proposé par un membre », et rattache la proposition à sa fiche. Elle nettoie et vérifie chaque champ (https, dates, longueurs) et limite à 5 propositions par jour.
- **Modifier ou retirer :** le membre ne le peut que sur ses propres propositions, tant qu'elles sont en relecture. Il ne peut jamais changer le statut ni l'origine.
- **Publier ou refuser :** uniquement les admins, contrôle fait par la base. Un refus enregistre un motif facultatif.
- **Inscriptions :** les noms et e-mails ne sont jamais publics.

## 3. Pages
- **Agenda et page événement :**
  - le type, le format, le tarif, l'organisateur (« Organisé par Les Podcasteur·euses du Sud » ou « Proposé par [nom] ») et le compteur « 12 personnes viennent » ;
  - le bouton « Je viens » ;
  - « Ajouter à mon agenda » : fichier .ics et lien Google Agenda ;
  - les événements passés passent automatiquement dans les archives.
- **Formulaire « Proposer un événement » :** visible seulement pour les membres à jour. Les autres voient un lien vers la connexion ou l'adhésion. Il contient le type, le format, l'adresse ou le lien de connexion, le tarif, le lien d'inscription externe et le visuel paysage.
- **Espace membre, « Mes événements » :**
  - le statut de chaque proposition (en relecture, publié, refusé avec le motif) ;
  - la modification possible tant que c'est en relecture ;
  - la liste des personnes qui viennent.
- **Administration :** une file « Propositions en relecture » en tête, avec les boutons Publier et Refuser (motif facultatif), en plus de la liste actuelle.

## 4. Référencement
- **Plan du site :** chaque événement publié y entre. Le plan actuel est un fichier fixe, qui ne voit pas les nouveaux événements. J'ajoute donc un second plan, tenu à jour automatiquement par une fonction serveur et déclaré au moteur de recherche dans le fichier robots.txt.
- **Données structurées Event complètes :** dates, lieu ou lien en ligne, mode de participation (sur place ou en ligne), statut, organisateur, tarif, image et description.

## 5. Ensuite
- Scan de sécurité, puis corrections.
- Test d'une proposition complète avec des **comptes fictifs uniquement** :
  1. un membre fictif à jour propose ;
  2. un administrateur fictif, créé pour le test, la publie, puis en refuse une autre ;
  3. un visiteur clique « Je viens » ;
  4. l'organisateur voit la liste.
- Je vérifie aussi qu'un membre pas à jour, un autre membre et un visiteur ne peuvent ni proposer, ni publier, ni voir les noms.
- Les comptes fictifs et toutes les traces sont supprimés ensuite.

## Questions
1. **« Je viens » et le formulaire d'inscription actuel :** « Je viens » remplace le formulaire actuel sur toutes les pages d'événement à venir (les 16 inscriptions existantes comptent dans le nombre), ou il reste une option à activer événement par événement, comme aujourd'hui ?
2. **Retirer une proposition :** un membre peut-il retirer (supprimer) sa proposition tant qu'elle est en relecture ?
