CREATE POLICY "Podcasters can delete own podcasts"
ON public.podcasts
FOR DELETE
TO authenticated
USING (lower(email) = lower((auth.jwt() ->> 'email'::text)));