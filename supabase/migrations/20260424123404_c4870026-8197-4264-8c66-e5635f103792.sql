-- Table des inscriptions aux événements
CREATE TABLE public.evenement_inscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evenement_id UUID NOT NULL REFERENCES public.evenements(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  structure TEXT,
  statut TEXT NOT NULL DEFAULT 'confirmee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajout d'une colonne pour activer le formulaire d'inscription par événement
ALTER TABLE public.evenements
ADD COLUMN IF NOT EXISTS inscription_activee BOOLEAN NOT NULL DEFAULT false;

-- Index pour les requêtes par événement
CREATE INDEX idx_evenement_inscriptions_evenement_id ON public.evenement_inscriptions(evenement_id);
CREATE INDEX idx_evenement_inscriptions_created_at ON public.evenement_inscriptions(created_at DESC);

-- Contrainte : un email ne peut pas s'inscrire deux fois au même événement
CREATE UNIQUE INDEX idx_evenement_inscriptions_unique_email ON public.evenement_inscriptions(evenement_id, lower(email));

-- Activer RLS
ALTER TABLE public.evenement_inscriptions ENABLE ROW LEVEL SECURITY;

-- Politique : tout le monde peut s'inscrire (formulaire public)
CREATE POLICY "Anyone can register to an event"
ON public.evenement_inscriptions
FOR INSERT
TO public
WITH CHECK (true);

-- Politique : les admins peuvent tout voir
CREATE POLICY "Admins can view all inscriptions"
ON public.evenement_inscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Politique : les admins peuvent mettre à jour
CREATE POLICY "Admins can update inscriptions"
ON public.evenement_inscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Politique : les admins peuvent supprimer
CREATE POLICY "Admins can delete inscriptions"
ON public.evenement_inscriptions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));