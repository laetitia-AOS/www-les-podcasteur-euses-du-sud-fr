# Studios : fiches enrichies et demande de devis groupée

## Avant de commencer
- **Les maquettes « Fiche studio » et « Fiche structure » ne sont pas arrivées.** Seul le texte a été joint, et le PDF reçu plus tôt ne contient que la liste des studios et celle des structures. Sans elles, je suis votre description et le style des autres fiches. Si vous les avez, envoyez-les avant que je code ces deux pages.
- **E-mails : aucun domaine d'envoi n'est encore relié au projet.** Les demandes de devis sont enregistrées et visibles dans l'espace des studios dès maintenant. Les e-mails aux studios et la confirmation au demandeur partiront dès que votre domaine sera configuré, avec les e-mails intégrés de Lovable uniquement.
- **Aujourd'hui :** 2 studios et 2 structures sont en ligne. Leurs informations actuelles sont reprises dans les nouveaux champs, sans rien effacer.

## 1. Données

### Nouvelle table `fiches_lieux` (une ligne par studio ou structure, liée à sa fiche)
| Champ | Contenu | Pour |
|---|---|---|
| tarif_heure | nombre en euros : « à partir de … € / heure » | studio |
| capacite_voix | nombre de voix (1 à 50) | studio |
| acces_transports | texte, 200 caractères | les deux |
| services | choix parmi 7 : location du studio, enregistrement audio, vidéo-podcast, montage, réalisation, direct, studio mobile | studio |
| photos | 5 adresses d'images au maximum | les deux |
| equipement | micros, caméras, lumières et décor (texte court chacun) et technicien·ne sur place (oui/non) | studio |
| accessibilite | texte, 300 caractères | les deux |
| faq | 3 questions-réponses au maximum | les deux |
| liens | site et réseaux sociaux (adresses https) | les deux |
| propositions | « Ce que [structure] propose aux podcasteur·euses » : 3 entrées (titre et texte) | structure |
| presse | liens presse datés (titre, lien, date), 10 au maximum | les deux |
| podcasts_lies | podcasts membres liés : « Enregistrés ici », « Membres passés à l'antenne » ou « accompagnés », avec date, 12 au maximum | les deux |
| intitule_membres | « Membres passés à l'antenne » ou « Membres accompagnés » | structure |

- **Ce qui ne change pas :** les informations actuelles des fiches restent en place, et l'adresse e-mail de contact n'est jamais affichée ni lue par cette table.
- **Lien aux événements :** chaque événement de l'agenda reçoit un champ facultatif « Structure organisatrice », rempli par un·e admin. Il sert au bloc « À venir » de la fiche structure.
- **Année d'adhésion :** une fonction renvoie seulement l'année de la première adhésion valide d'un studio, rien d'autre.

### Règles d'accès des fiches
- **Lecture :** tout le monde, seulement pour un studio ou une structure dont la fiche est visible.
- **Modification :** uniquement le studio ou la structure connecté·e avec l'e-mail de sa fiche, et les administrateur·ices.
- **Contrôle serveur :**
  - longueurs maximales et adresses https uniquement ;
  - 5 photos, 3 questions fréquentes, 3 propositions et 12 podcasts liés au maximum ;
  - seuls les 7 services sont acceptés ;
  - un podcast lié doit être une fiche visible.
- **Photos :** elles sont envoyées dans le dossier personnel du studio, comme aujourd'hui pour les membres connectés.

## 2. Demande de devis

### Nouvelle table `demandes_devis` (une ligne par demande)
- Champs : nom, e-mail, format, période, département, besoins (parmi les 7 services), description du projet (2 000 caractères), studio visé (vide pour une demande groupée), nombre de studios contactés, date.
- **Destinataires :** chaque studio contacté reçoit la demande dans sa boîte « Demandes reçues », de type « devis », dans la même boîte que les messages et collabs.

### Qui reçoit une demande groupée (choisi par le serveur, jamais par la page)
- Un studio la reçoit s'il remplit toutes ces conditions :
  - membre à jour de cotisation ;
  - fiche visible ;
  - accepte d'être contacté ;
  - situé dans le département choisi ;
  - propose **tous** les besoins cochés.
- S'il n'y en a aucun, rien n'est envoyé, et un message propose d'enlever un besoin ou de changer de département.
- **Bouton « Demander un devis » sur une carte ou une fiche :** même formulaire, envoyé à ce seul studio.

### Règles d'accès des devis
- **Qui lit :** une demande n'est visible que par les studios à qui elle a été envoyée (via leur espace membre) et par les admins. Personne d'autre, même connecté.
- **Qui écrit :** uniquement la fonction serveur, qui vérifie et nettoie chaque champ.
- **Limite :** **3 demandes de devis par jour et par adresse e-mail**, groupées ou à un seul studio.
- **Structures :** le formulaire Contact des structures suit les mêmes règles : réception dans leur espace, et 3 envois par jour et par adresse.

### Confirmations
- À l'écran : « Votre demande est partie vers 4 studios ».
- Par e-mail, une fois le domaine configuré : chaque studio contacté reçoit la demande, et le demandeur reçoit une confirmation avec le nombre de studios contactés.

## 3. Pages
- **Page Studios :**
  - le filtre « J'ai besoin de » reprend les 7 services ;
  - les cartes affichent le tarif, la capacité et l'accès ;
  - la section sombre devient la demande groupée, avec format, période, département, besoins et description.
- **Fiche studio :**
  - fil d'Ariane, type et ville, puis le titre, seul titre principal de la page ;
  - phrase d'accroche avec tarif et capacité, puis galerie de 3 photos et description ;
  - services proposés et non proposés, équipement, « Enregistrés ici » et questions fréquentes ;
  - encadré « En pratique » : tarif, capacité, adresse, accès, accessibilité, boutons Demander un devis et Écrire au studio, plan, liens et année d'adhésion ;
  - en bas : le formulaire de devis pour ce studio, puis les autres studios de la même ville.
- **Fiche structure :**
  - logo, type et ville, titre et phrase d'accroche ;
  - boutons Contacter et Site ;
  - bloc « Ce que [structure] propose aux podcasteur·euses » ;
  - « Membres passés à l'antenne » ou « Membres accompagnés », avec dates ;
  - « À venir » ;
  - encadré Contact avec formulaire.
- **Espace membre :** un bloc « Mon studio » ou « Ma structure » pour remplir tous ces champs. Les mêmes champs sont dans l'administration.
- **Référencement :**
  - titres « Studio podcast à [Ville] : [Nom] » et « [Nom], [type] partenaire des podcasteur·euses du Sud » ;
  - données structurées LocalBusiness (adresse, services, tarif indicatif) ou Organization, plus FAQPage pour les questions.

## 4. Ensuite
- Scan de sécurité, puis corrections.
- Tests avec **un compte studio fictif et un compte membre fictif**, puis suppression de toutes les traces :
  - le studio modifie sa fiche, mais pas celle d'un autre ;
  - le membre ne peut modifier aucune fiche studio ;
  - chaque studio ne voit que les devis qui lui ont été envoyés ;
  - la 4e demande dans la journée est refusée ;
  - un visiteur ne lit aucune demande.

## Questions
1. **Plan dans l'encadré « En pratique » :** une carte intégrée ferait appel à un service de cartes extérieur. Je propose plutôt un bouton « Voir le plan », qui ouvre l'adresse dans l'application de cartes du visiteur, comme sur les pages événements. D'accord ?
2. **Demande groupée :** un studio doit proposer tous les besoins cochés pour la recevoir, ou un seul suffit ?
3. **Studios mobiles :** ils reçoivent aussi les demandes des autres départements de la région, ou seulement celles de leur département ?
