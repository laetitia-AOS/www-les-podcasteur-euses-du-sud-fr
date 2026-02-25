
CREATE POLICY "Adhesions are readable"
ON public.adhesions FOR SELECT
USING (true);
