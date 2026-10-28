REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.episodes FROM anon, authenticated;
REVOKE ALL ON public.flux_etat FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.flux_etat FROM authenticated;
REVOKE ALL ON public.verifications_flux FROM anon, authenticated;
REVOKE ALL ON public.sync_episodes_runs FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.sync_episodes_runs FROM authenticated;
REVOKE ALL ON public.images_en_attente FROM anon;
REVOKE INSERT, TRUNCATE, REFERENCES, TRIGGER ON public.images_en_attente FROM authenticated;