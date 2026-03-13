
-- Create storage bucket for studio gallery images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('studio-galleries', 'studio-galleries', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to studio galleries
CREATE POLICY "Public read studio galleries" ON storage.objects FOR SELECT TO public USING (bucket_id = 'studio-galleries');

-- Allow public uploads to studio galleries
CREATE POLICY "Public upload studio galleries" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'studio-galleries');
