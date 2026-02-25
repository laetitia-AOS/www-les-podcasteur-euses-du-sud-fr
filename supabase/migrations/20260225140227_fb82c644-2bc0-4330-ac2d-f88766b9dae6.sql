CREATE POLICY "Admins can insert adhesions"
ON public.adhesions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));