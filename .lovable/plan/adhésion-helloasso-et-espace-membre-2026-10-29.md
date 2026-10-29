# Adhésion HelloAsso et espace membre

Vos réponses sont prises en compte :
- un seul formulaire HelloAsso, qui garde ses deux formules ;
- rappels envoyés par un bouton dans l'administration ;
- paiement test simulé, sans clé ;
- suppression immédiate des données.

## Ce qui change pour les visiteur·ices et les membres

**1. Formules.** On garde le formulaire HelloAsso actuel, réglages compris :
- personne : 20 €, montant libre dès 1 € ;
- personne morale : 100 €.

À l'étape 3 de l'inscription, le site affiche une consigne claire selon le type choisi à l'étape 1. Exemples : « Choisissez Adhésion individuelle » ou « Choisissez Adhésion personne morale, 100 € ». Le paiement est ensuite classé « personne » ou « studio / agence » d'après la formule réellement payée chez HelloAsso, jamais d'après ce que dit le site.

**2. Confirmation du paiement.** La notification HelloAsso reste traitée côté serveur, avec les clés déjà enregistrées dans les Secrets.
- Quand HelloAsso confirme le paiement : statut « membre à jour » et date d'échéance un an plus tard.
- En cas de renouvellement anticipé, l'année s'ajoute à l'échéance en cours : on ne perd aucun jour.
- Tant que HelloAsso refuse la lecture des commandes, le paiement reste « À vérifier sur HelloAsso », comme vous l'avez demandé. L'échéance part alors du jour où un·e admin le valide.

**3. Échéance.** Le jour de l'échéance, la fiche disparaît de tout le site public : annuaire, studios, fiches, épisodes, accueil. Rien n'est supprimé, et la fiche revient dès le paiement suivant. Aucune tâche programmée n'est nécessaire : le site compare la date d'échéance à la date du jour à chaque lecture.

**Attention, effet immédiat :** aujourd'hui, 21 fiches visibles sur 41 (20 personnes) n'ont pas d'adhésion à jour :
- 16 podcasteur·euses ;
- 2 soutiens ;
- 1 professionnel·le ;
- 1 studio ;
- 1 structure.

Elles disparaîtront du site à la mise en ligne. Avant de publier, l'administration vous en donnera la liste, pour rattacher les paiements faits sous un autre nom. La première échéance d'un membre à jour tombe le 11 février 2027.

**4. Rappels 30 jours et 7 jours.** Dans l'administration, un onglet « Échéances proches » liste les membres concernés, avec un bouton « Envoyer le rappel » par membre :
- un clic envoie un seul e-mail, à ce membre seulement, avec le lien de renouvellement ;
- le site retient chaque rappel envoyé, pour ne pas l'envoyer deux fois.

Dans l'espace membre, un bandeau apparaît 30 jours avant l'échéance, puis après l'échéance, avec le bouton « Renouveler ».
**Prérequis :** votre domaine d'envoi doit être relié dans Lovable. Sans lui, le bouton reste grisé et affiche pourquoi.

**5. Espace membre, en haut :**
- statut (à jour, se termine bientôt, terminée, en vérification) et date d'échéance ;
- bouton « Renouveler », qui ouvre HelloAsso avec la bonne consigne ;
- lien « Voir mon profil public », seulement si la fiche est visible ;
- chiffres du mois en cours : vues du profil, écoutes lancées depuis le site, demandes reçues.

**Comment on compte :**
- une vue ou une écoute est comptée une seule fois par jour et par visiteur·ice ;
- les visites du membre sur sa propre fiche ne comptent pas ;
- aucun cookie, aucun nom, aucune adresse IP conservée : seulement une empreinte brouillée, effacée sous 48 heures, qui sert à éviter qu'on gonfle les chiffres en rechargeant la page ;
- une écoute = lecture d'un épisode dans le lecteur du site, ou clic sur le lien d'écoute.

Chaque membre ne voit que ses propres chiffres, et la règle est appliquée par le serveur. Les chiffres ne démarrent qu'à la mise en ligne : il n'y a pas d'historique.

**6. Administration, « Membres ».** Une ligne par membre :
- nom, type (personne ou studio / agence), statut, échéance, montant payé, date du dernier paiement ;
- filtres par statut et par type ;
- export tableur protégé.

Réservé aux administrateur·ices, et la règle est appliquée par le serveur.

**7. « Supprimer mes données ».** Le membre confirme en tapant SUPPRIMER. Tout est effacé immédiatement :
- ses fiches et podcasts ;
- leurs détails studio ;
- ses épisodes et chiffres ;
- ses photos ;
- ses messages et devis reçus ;
- ses propositions d'événement en relecture ;
- ses « Je viens » ;
- ses rattachements de paiement ;
- son compte de connexion.

Deux exceptions :
- **Paiements :** l'association doit garder ses justificatifs comptables. On garde donc la date, le montant, la formule et le numéro de commande HelloAsso, mais on efface le nom, l'e-mail et le téléphone.
- **Messages envoyés à d'autres membres :** ils restent chez leurs destinataires, signés « Membre supprimé ».

Un événement déjà publié reste dans l'agenda, avec « Proposé par un membre du réseau ».

## Vérifications prévues

- **Paiement simulé avec des données fictives :** une fausse commande est refusée. Une commande que HelloAsso ne laisse pas lire est enregistrée « à vérifier », et aucune fiche n'est activée. Après validation par un·e admin : membre à jour, échéance calculée, fiche visible.
- **Échéance dépassée :** la fiche disparaît du site, sans être supprimée.
- **Deux comptes membres fictifs et un compte admin fictif :** un membre ordinaire n'accède ni à l'administration, ni à la liste des membres, ni aux chiffres d'un autre membre. Chacun ne voit que les siens.
- **Suppression des données** testée sur un compte fictif.
- Contrôle des pages sur ordinateur et sur mobile, puis scan de sécurité approfondi.
- Je ne pourrai pas tester un vrai paiement chez HelloAsso. Le premier vrai paiement sera à surveiller.

## Détails techniques

**Données (ajouts seulement, rien n'est effacé) :**
- Table `adhesions` :
  - nouvelle colonne `formule` (personne / studio), déduite du nom de la formule HelloAsso. Remplie pour les paiements existants : « personne morale » donne studio, les autres donnent personne ;
  - nouvelle colonne `date_echeance`, calculée par un déclencheur quand le statut passe à `active` : la plus tardive entre le paiement et l'échéance en cours du même membre (rattachements compris), plus un an. Remplie pour les paiements existants : date d'adhésion plus un an. Les adhésions d'avant 2026 restent expirées (règle de transition).
- `membre_a_jour(email)` devient : une adhésion `active` dont `date_echeance` est encore à venir (rattachements compris). Le résultat est le même qu'aujourd'hui pour les adhésions existantes.
- Règle de lecture publique de `podcasts` : on passe de `valide = true` à `valide AND membre_a_jour(email)`. La personne connectée et les admins gardent leur accès. `lieu_visible`, `annee_adhesion` et `episodes_visibles` suivent la même règle.
- `mon_adhesion()` renvoie aussi `date_echeance`, `formule` et un statut calculé. Les paiements « à vérifier » sont inclus, pour afficher « en vérification ».
- Nouvelle table `rappels_adhesion` (adhésion, palier 30 ou 7, envoyé le, envoyé par) : écriture et lecture par les admins seulement.
- Nouvelle table `stats_fiches_jour` (podcast_id, jour, vues, écoutes) : aucune lecture directe. Lecture par `mes_stats()`, limitée à l'e-mail connecté, avec les demandes reçues comptées depuis `contact_requests`.
- Nouvelle table `stats_empreintes` (empreinte brouillée, fiche, type, jour) : aucun accès depuis le site, purge au-delà de 48 h.
- `admin_membres()` : réservée à `has_role('admin')`. Elle regroupe fiches et adhésions par personne (rattachements compris).

**Fonctions serveur :**
- `helloasso-webhook` : ajoute `formule`. L'échéance vient du déclencheur. La logique de vérification ne change pas.
- `compter-stat` (publique) : reçoit une fiche et « vue » ou « écoute ». Elle vérifie que la fiche est visible, calcule l'empreinte avec un sel aléatoire généré et stocké dans les Secrets par le site (aucune clé à vous demander), dédoublonne, incrémente le compteur, et limite le nombre d'appels.
- `rappel-adhesion` (admin seulement) : un membre et un palier par appel. Elle envoie l'e-mail « Votre adhésion se termine le… » via l'envoi intégré de Lovable, avec un modèle aux couleurs du site, et enregistre le rappel. Elle sera activée après la configuration du domaine d'envoi.
- `supprimer-mes-donnees` (membre connecté, sur sa propre adresse seulement) : effectue tous les effacements décrits plus haut, l'anonymisation des paiements et la suppression du compte, en une seule opération.

**Écrans :**
- Espace membre : bandeau de statut, chiffres, zone « Supprimer mes données ».
- Admin > Adhésions : onglets « Membres » et « Échéances proches ».
- Étape 3 d'Adhérer : consigne selon le type.
- Le lecteur et les fiches appellent `compter-stat`.
- La page de politique cookies indique la mesure sans cookie.
