CREATE POLICY "Anyone can upload event images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'event-images');