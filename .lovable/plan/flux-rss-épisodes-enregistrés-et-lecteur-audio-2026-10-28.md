# Flux RSS, épisodes enregistrés et lecteur audio

## Ce qui existe déjà (à adapter, pas à recréer)
- Le champ « Lien du flux RSS » existe déjà sur chaque podcast, dans l'inscription, Mes podcasts et l'administration. Aujourd'hui le site vérifie seulement que l'adresse commence par https://.
- Le lecteur fixe en bas existe déjà : il continue pendant la navigation et a déjà lecture/pause, -15 s, +30 s, la barre de progression et le lien vers la fiche.
- Les épisodes sont lus en direct à chaque visite (19 podcasts sur 29 trouvés), sans rien enregistrer. C'est ce qui change : ils seront relus toutes les 6 heures et enregistrés.

## 1. Données

### Nouvelle table `episodes` (les 10 derniers épisodes de chaque podcast)
| Champ | Contenu |
|---|---|
| id | identifiant |
| podcast_id | podcast concerné (supprimé avec le podcast) |
| guid | identifiant de l'épisode dans le flux, unique par podcast, pour éviter les doublons |
| titre | 300 caractères maximum |
| date_publication | date et heure |
| duree_secondes | nombre |
| audio_url | adresse https du fichier audio |
| image_url | image de l'épisode, sinon celle du flux |
| resume | texte seul, sans balises, 300 caractères maximum |
| lien | page de l'épisode, si elle existe |
| mis_a_jour | date de la dernière lecture |

**Règles d'accès**
- **Lecture : tout le monde, visiteurs compris**, mais seulement pour les épisodes d'un podcast visible dont le membre est à jour de cotisation. Le serveur filtre, ce n'est pas l'affichage qui cache.
- **Créer, modifier, supprimer : personne depuis le site**, ni visiteur, ni membre, ni admin. Seule la fonction serveur écrit.

### Nouvelle table `flux_etat` (santé de chaque flux)
- Champs : podcast_id, statut (ok / erreur / introuvable), message clair, date de dernière lecture, nombre d'épisodes trouvés.
- Accès : les admins la lisent. Un membre ne voit l'état que de ses propres podcasts, via une fonction limitée à son e-mail. Ainsi Mes podcasts peut afficher « Votre flux ne répond pas ». Personne n'écrit depuis le site.

### Nouvelle fonction en base `membre_a_jour(e-mail)`
- Elle répond oui si une adhésion active existe à cette adresse (ou y est rattachée par un·e admin), datée de 2026 ou après et de moins de 12 mois. C'est la même règle que l'espace membre.
- Une adhésion « À vérifier sur HelloAsso » ne compte pas.

### Pas de nouveau champ sur les fiches
- Le flux reste dans le champ existant.
- Un membre ne modifie que les podcasts liés à son e-mail : c'est la règle actuelle, je la garde.
- Le serveur vérifie toujours que le lien commence par https.

## 2. Fonctions serveur

### `verifier-flux` (nouvelle, appelée par les trois formulaires avant d'enregistrer)
- Elle refuse avec un message clair :
  - une adresse qui ne commence pas par https ;
  - une adresse interne ou une adresse IP (protection contre le détournement du serveur) ;
  - un flux qui ne répond pas en 8 secondes ;
  - un fichier de plus de 5 Mo ;
  - un fichier qui n'est pas un flux RSS ;
  - un flux sans épisode audio.
- Réponse en cas de succès : « Flux valide : 42 épisodes, dernier le 12 octobre ».
- Elle est limitée à 20 vérifications par heure et par appareil.
- **Limite honnête :** la base ne peut pas aller lire une adresse sur Internet. Si quelqu'un contourne les formulaires et enregistre un flux faux, c'est la lecture des 6 heures qui le repérera : statut « erreur », aucun épisode affiché, et le membre le voit dans Mes podcasts.

### `sync-episodes` (nouvelle, serveur uniquement)
- Elle se lance toutes les 6 heures, soit 4 fois par jour. Le coût est négligeable.
- Elle lit le flux de chaque podcast visible dont le membre est à jour.
- Pour chacun, elle garde les 10 derniers épisodes et retire les plus anciens, puis met à jour `flux_etat`.
- Elle ne peut être déclenchée que par la tâche planifiée, grâce à un code secret généré automatiquement. Vous n'avez rien à fournir.
- Elle ne modifie jamais les fiches.

### `podcast-episodes` (existante) : supprimée
Le site lira directement la table des épisodes, ce qui est plus rapide.

## 3. Lecteur et boutons
- Lecteur : on garde l'existant. Je vérifie qu'il apparaît sur toutes les pages publiques (et pas dans l'administration) et qu'il colle aux maquettes.
- Tous les boutons lecture suivent la même règle : s'il y a des épisodes, le dernier se lance dans le lecteur ; sinon, le lien d'écoute s'ouvre dans un nouvel onglet.
- À l'arrivée sur le site, le lecteur charge sans le lancer le dernier épisode d'un membre à jour tiré au hasard, parmi ceux qui ont publié dans les 30 derniers jours. S'il n'y en a aucun, le lecteur reste fermé.

## 4. Pages
- **Accueil :** la section s'appelle « Derniers épisodes » et montre les 4 plus récents, tous membres confondus.
- **Fiche :** une section « Épisodes » liste les 10 épisodes avec leur titre, leur date, leur durée et leur résumé, écrits en texte sur la page. Chaque épisode a un bouton lecture.
- **Référencement :** données structurées PodcastSeries et PodcastEpisode sur chaque fiche. Google les lit, car il affiche les pages comme un navigateur. Certains réseaux sociaux ne les verront pas.

## 5. Ensuite
1. Scan de sécurité, rapide puis approfondi, et corrections.
2. Tests avec **des comptes fictifs uniquement**, puis suppression de toutes les traces :
   - un membre fictif à jour, avec un flux : il voit ses épisodes et l'état de son flux, et ne peut modifier ni le podcast d'un autre ni un épisode ;
   - un membre fictif pas à jour : ses épisodes ne s'affichent pas ;
   - un visiteur non connecté : il lit les épisodes et ne peut rien écrire.

## Une question avant de commencer
Sans flux renseigné, le site retrouve aujourd'hui le flux tout seul (lien Apple, lien Ausha ou recherche du nom exact). C'est ce qui donne des épisodes à 19 podcasts. Je garde cette recherche automatique, utilisée seulement quand le champ est vide, ou je n'utilise que les flux saisis ? Dans ce second cas, les podcasts sans flux saisi n'auraient plus d'épisodes tant que le membre ne l'a pas ajouté.
