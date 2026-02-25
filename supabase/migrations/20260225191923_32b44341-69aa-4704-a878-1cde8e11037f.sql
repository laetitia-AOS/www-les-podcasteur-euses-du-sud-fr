CREATE POLICY "Admins can delete podcasts"
ON public.podcasts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));