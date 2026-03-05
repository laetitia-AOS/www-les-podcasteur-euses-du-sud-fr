
-- Add new columns for enhanced events
ALTER TABLE public.evenements
  ADD COLUMN sous_titre text,
  ADD COLUMN image_url text,
  ADD COLUMN places integer;

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view event images
CREATE POLICY "Public read access for event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow authenticated admins to upload event images
CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated admins to delete event images
CREATE POLICY "Admins can delete event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images'
  AND public.has_role(auth.uid(), 'admin')
);
