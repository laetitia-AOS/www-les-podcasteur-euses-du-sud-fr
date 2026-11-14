-- L'Onde du Sud : quand un·e admin supprime un numéro, ses fichiers sont effacés avec lui.
CREATE POLICY "Admins suppriment les fichiers de L'Onde"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'onde' AND public.has_role(auth.uid(), 'admin'::public.app_role));