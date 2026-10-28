# Qui cherche quoi et demandes de collab

## À faire de votre côté avant les e-mails
Aucun domaine d'envoi n'est encore relié au projet. L'e-mail « vous avez reçu une demande de collab » ne pourra partir qu'une fois votre domaine configuré avec le bouton « Configurer le domaine d'envoi », sous ce plan.
Tout le reste peut se faire avant : les demandes sont enregistrées et visibles dans l'espace membre dès maintenant.

## 1. Choix « Je cherche » et « J'apporte »

### Données (table des fiches, sans rien supprimer)
| Nouveau champ | Contenu |
|---|---|
| cherche_choix | liste de codes parmi les 12 choix |
| apporte_choix | liste de codes parmi les 12 choix |
| cherche_precision | texte libre, 120 caractères |
| apporte_precision | texte libre, 120 caractères |

- **Les 12 choix :** voix off, montage, mixage, stratégie, co-production d'un format, être invité·e, recevoir des invité·es, sponsors et partenaires, organisation d'événements, formation, studio, autre.
- **Les anciennes listes restent en base, intactes**, marquées « remplacées » : aucune donnée n'est perdue, même si quelque chose tourne mal.
- **Reprise des 35 fiches :** les anciens choix sont convertis automatiquement (tableau ci-dessous), et le texte actuel est recopié dans le champ de précision.
- **Point à trancher :** 5 fiches ont un texte actuel de plus de 120 caractères (139 au maximum). Je propose de les recopier en entier : la limite de 120 caractères ne s'appliquerait qu'aux nouvelles saisies, et le membre ne pourrait que les raccourcir.
- **Contrôle serveur :** seuls les 12 codes sont acceptés ; la précision est nettoyée et limitée à 120 caractères.

### Conversion des anciens choix
| Ancien texte | Nouveau choix |
|---|---|
| Faire de la voix off / Un·e voix off | voix off |
| Proposer mes compétences techniques (son, montage) / Un·e monteur·euse, ingénieur son | montage et mixage |
| Partager mon expertise stratégique / Un·e expert·e en stratégie | stratégie |
| Co-produire un format / podcasteur·euse pour co-production / Co-production de contenus | co-production d'un format |
| Participer à un podcast en tant qu'invité·e | être invité·e |
| Des invité·es pour mon podcast | recevoir des invité·es |
| Partenariat commercial / Des sponsors, partenaires commerciaux / Partenariats avec l'association | sponsors et partenaires |
| Organiser un événement / Un·e partenaire pour un événement / Accueil d'événements | organisation d'événements |
| Mentorer un·e débutant·e / Un·e coach ou mentor·e | formation |
| Mettre à disposition un studio / Un·e studio d'enregistrement | studio |
| Visuels, motion, graphiste, diffusion, ressources, Autre | autre |
| Publics (Entreprises, Associations, Étudiant·es…) : ce ne sont pas des services | aucun choix, texte gardé dans la précision |

### Formulaires concernés
Inscription (page Adhérer), espace membre (Mon profil) et administration : 12 cases à cocher plus un champ « Précisez » pour chaque question.

## 2. Annuaire
- Le filtre « Je cherche quelqu'un pour » propose les 12 choix et affiche les profils qui l'**apportent**.
- Phrase de résultat : « N profils apportent [choix] ». Avec plusieurs choix : « N profils apportent montage ou mixage ».

## 3. Demande de collab
- **Bouton « Proposer une collab » sur chaque fiche** dont le membre accepte d'être contacté. Il remplace le formulaire actuel « Écrire à… », pour éviter deux formulaires presque identiques.
- **Formulaire :** nom, e-mail, message de 1 000 caractères maximum.
- **Enregistrement :** la demande est rangée avec les messages et devis actuels, avec un type « collab ». C'est la même boîte de réception pour le membre.
- **E-mail au membre :** un e-mail automatique, envoyé avec votre domaine, contient le nom de l'expéditeur, son e-mail et le message. Il est envoyé par le serveur : l'adresse du membre n'est jamais renvoyée à la page ni montrée à l'expéditeur.

### Changements de données
Sur la table des messages reçus, on ajoute :
- **type** : message, devis ou collab. Les demandes existantes deviennent « message » ou « devis ».
- **lu_le** : date de lecture par le membre, vide tant que ce n'est pas lu.

## 4. Règles d'accès
- **Qui lit une demande :** uniquement son destinataire, via une fonction limitée à l'e-mail connecté, et les administrateur·ices. Personne d'autre, même connecté. Aucune lecture directe de la table.
- **Qui écrit :** uniquement la fonction serveur. Elle vérifie que le destinataire existe, est visible et accepte d'être contacté, et nettoie chaque champ (longueurs, caractères invisibles, e-mail valide).
- **Limite :** 5 demandes de collab par jour et par adresse e-mail. Les messages et devis gardent leur limite actuelle de 5 par heure.
- **Marquer comme lu :** une seule fonction, qui ne touche que les demandes du membre connecté.
- **Règle déjà en place, gardée :** les messages reçus avant le 28/10/2026 restent visibles par l'équipe seulement.

## 5. Espace membre, « Demandes reçues »
- **Liste :** nom, type (collab, message ou devis), extrait du message, date.
- **Bouton « Répondre » :** il ouvre la messagerie de la personne connectée vers l'expéditeur, avec l'objet « Re : votre proposition de collab ».
- **Lecture :** ouvrir une demande la marque comme lue.
- **Compteur dans le menu :** le nombre de demandes non lues, à côté de « Demandes reçues ».

## 6. Ensuite
- Scan de sécurité, puis corrections.
- Test avec deux comptes membres **fictifs** : chacun ne voit que ses demandes, ne peut pas marquer celles de l'autre, et un visiteur ne lit rien. Suppression de toutes les traces ensuite.
- Test de la limite de 5 par jour.
- Test de l'e-mail : seulement après la configuration de votre domaine, vers une adresse fictive.

## Questions
1. Les 5 textes de plus de 120 caractères : je les recopie en entier, comme proposé ?
2. « Proposer une collab » remplace bien le formulaire « Écrire à… » sur les fiches ?
