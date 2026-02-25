
CREATE TABLE public.adhesions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email text,
  prenom text,
  nom text,
  telephone text,
  montant numeric,
  type_adhesion text,
  statut text NOT NULL DEFAULT 'active',
  date_adhesion timestamptz,
  helloasso_order_id text,
  raw_payload jsonb
);

ALTER TABLE public.adhesions ENABLE ROW LEVEL SECURITY;

-- Public insert for webhook
CREATE POLICY "Webhook can insert adhesions"
ON public.adhesions FOR INSERT
WITH CHECK (true);

-- No public select (admin only via service role)
