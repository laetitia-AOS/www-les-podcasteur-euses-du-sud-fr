
-- Create contacts table for the ecosystem contact form
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profil TEXT NOT NULL,
  objet TEXT NOT NULL,
  message TEXT NOT NULL,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  structure TEXT,
  email TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'Nouveau',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact request
CREATE POLICY "Anyone can submit a contact"
ON public.contacts
FOR INSERT
WITH CHECK (true);
