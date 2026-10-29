-- Formulaires publics : la règle d'ajout vérifie elle-même le contenu (en plus des contrôles guard_*)
DROP POLICY IF EXISTS "Anyone can submit a contact" ON public.contacts;
CREATE POLICY "Formulaire de contact : envoi vérifié" ON public.contacts
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      statut = 'Nouveau'
      AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$' AND length(email) <= 255
      AND length(btrim(prenom)) BETWEEN 1 AND 100
      AND length(btrim(nom)) BETWEEN 1 AND 100
      AND length(btrim(objet)) BETWEEN 1 AND 150
      AND length(btrim(message)) BETWEEN 1 AND 5000
      AND (structure IS NULL OR length(structure) <= 150)
    )
  );

DROP POLICY IF EXISTS "Anyone can register to an event" ON public.evenement_inscriptions;
CREATE POLICY "Je viens : inscription vérifiée" ON public.evenement_inscriptions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      statut = 'confirmee'
      AND (user_id IS NULL OR user_id = auth.uid())
      AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$' AND length(email) <= 255
      AND length(btrim(prenom)) BETWEEN 1 AND 100
      AND length(nom) <= 100
      AND (structure IS NULL OR length(structure) <= 150)
      AND EXISTS (
        SELECT 1 FROM public.evenements e
        WHERE e.id = evenement_id AND e.statut = 'publie' AND coalesce(e.date_fin, e.date_debut) > now()
      )
    )
  );

DROP POLICY IF EXISTS "Anyone can submit a podcast" ON public.podcasts;
CREATE POLICY "Inscription annuaire : fiche vérifiée" ON public.podcasts
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$' AND length(email) <= 255
      AND length(btrim(nom_podcast)) BETWEEN 1 AND 200
      AND length(description) <= 5000
      AND visible_sans_adhesion = false
      -- une fiche n'arrive validée que pour la personne connectée avec cette adresse (adhésion vérifiée par le déclencheur)
      AND (valide = false OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );