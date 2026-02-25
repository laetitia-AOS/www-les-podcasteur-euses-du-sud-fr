-- 1. Admin can see ALL evenements (including unpublished)
CREATE POLICY "Admins can view all evenements"
ON public.evenements FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Admin can insert evenements
CREATE POLICY "Admins can insert evenements"
ON public.evenements FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Admin can update evenements
CREATE POLICY "Admins can update evenements"
ON public.evenements FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Admin can delete evenements
CREATE POLICY "Admins can delete evenements"
ON public.evenements FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Admin can update contacts (change status)
CREATE POLICY "Admins can update contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));