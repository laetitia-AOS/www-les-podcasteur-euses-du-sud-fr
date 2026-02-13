
-- Create storage bucket for podcast thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('podcast-thumbnails', 'podcast-thumbnails', true);

-- Allow anyone to upload (no auth required for this public form)
CREATE POLICY "Anyone can upload podcast thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'podcast-thumbnails');

-- Allow public read access
CREATE POLICY "Podcast thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'podcast-thumbnails');
