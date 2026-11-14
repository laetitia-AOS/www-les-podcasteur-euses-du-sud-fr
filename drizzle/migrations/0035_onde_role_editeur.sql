-- L'Onde du Sud : rôle « editeur » (rédige et publie les numéros de la lettre, rien d'autre de l'admin).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editeur';