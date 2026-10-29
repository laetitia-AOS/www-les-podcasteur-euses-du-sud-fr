# Agenda : règles détaillées

Valables aussi pour `src/pages/Evenements.tsx`, `EvenementDetail.tsx`, `ProposerEvenement.tsx`, `AdminEvenements.tsx` et `src/lib/events.ts`.

- **Proposition :** côté site, l'enregistrement d'une proposition ne doit pas demander la ligne en retour (le membre ne peut pas la relire avant publication).
- **« Je viens » :** les inscriptions vont dans `evenement_inscriptions`. Le public ne voit que le nombre (`nb_venues`), l'organisateur·ice voit la liste (`mes_venues`).
- **Types :** codes figés en base (contrainte), libellés dans `EVENT_TYPES`. Le code `apero_ecoute` désigne le rendez-vous mensuel affiché « Atelier-écoute », car renommer un code casserait les fiches existantes.
- **Questions fréquentes :** `evenements.faq`, écrites par un admin seulement (les déclencheurs l'effacent pour un membre), sinon `faqParDefaut` (`src/lib/faqEvenement.ts`), pour que les réponses restent sous le contrôle de l'équipe.
- **Titres et textes :** affichés via `readableTitle`, émojis retirés à l'enregistrement par `sansEmojis`, pour garder une casse homogène quel que soit l'auteur·ice.
- **Dates :** toujours à l'heure de Paris (`heureParis`, `horairesParis`, `dateParis`, `isoParis`). Plusieurs jours via `surPlusieursJours` / `jourCourt` / `dateLongue` : une fin avant 6 h compte pour la veille.
- **Partage :** toujours l'adresse publique `/agenda/:slug` (une adresse de fonction serveur répond en texte brut). Texte et vignettes (1200×630, 1080×1080) faits dans le navigateur par `src/lib/partageEvenement.ts`.
