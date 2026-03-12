
-- Add collaboration columns to podcasts table
ALTER TABLE public.podcasts
  ADD COLUMN IF NOT EXISTS cherche_collaboration text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS peut_apporter text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS format_collaboration text DEFAULT NULL;

-- Create contact_requests table
CREATE TABLE public.contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  recipient_id uuid REFERENCES public.podcasts(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact request
CREATE POLICY "Anyone can submit a contact request"
  ON public.contact_requests FOR INSERT
  TO public
  WITH CHECK (true);

-- Admins can view all contact requests
CREATE POLICY "Admins can view contact requests"
  ON public.contact_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update contact requests
CREATE POLICY "Admins can update contact requests"
  ON public.contact_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete contact requests
CREATE POLICY "Admins can delete contact requests"
  ON public.contact_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
