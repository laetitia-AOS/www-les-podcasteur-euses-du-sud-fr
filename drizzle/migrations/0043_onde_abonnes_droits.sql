-- La liste des abonné·es n'est jamais accessible en direct : seules les fonctions onde_* y touchent.
REVOKE ALL ON public.onde_abonnes FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.onde_abonnes TO service_role;