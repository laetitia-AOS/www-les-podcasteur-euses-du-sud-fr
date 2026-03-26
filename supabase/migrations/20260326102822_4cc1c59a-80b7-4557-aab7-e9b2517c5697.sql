-- Allow anyone to submit an event (will be moderated by admins)
CREATE POLICY "Anyone can submit an event"
ON public.evenements
FOR INSERT
TO public
WITH CHECK (true);
