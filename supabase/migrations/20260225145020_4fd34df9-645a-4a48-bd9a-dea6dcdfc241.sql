
-- Allow authenticated podcasters to see their own podcast(s) by matching email
CREATE POLICY "Podcasters can view own podcasts"
ON public.podcasts
FOR SELECT
TO authenticated
USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- Allow authenticated podcasters to update their own podcast(s)
CREATE POLICY "Podcasters can update own podcasts"
ON public.podcasts
FOR UPDATE
TO authenticated
USING (lower(email) = lower(auth.jwt() ->> 'email'))
WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

-- Allow admins to see all podcasts
CREATE POLICY "Admins can view all podcasts"
ON public.podcasts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all podcasts
CREATE POLICY "Admins can update all podcasts"
ON public.podcasts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
