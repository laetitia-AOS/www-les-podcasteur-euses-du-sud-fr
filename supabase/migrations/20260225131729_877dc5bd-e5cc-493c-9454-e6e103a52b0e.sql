
CREATE TABLE public.evenements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  date_debut timestamp with time zone NOT NULL,
  date_fin timestamp with time zone,
  lieu text,
  adresse text,
  type text NOT NULL DEFAULT 'rencontre',
  lien_externe text,
  publie boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.evenements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evenements publiés visibles par tous"
  ON public.evenements
  FOR SELECT
  USING (publie = true);

CREATE POLICY "Insertion evenements via service role"
  ON public.evenements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Update evenements via service role"
  ON public.evenements
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Delete evenements via service role"
  ON public.evenements
  FOR DELETE
  USING (true);
