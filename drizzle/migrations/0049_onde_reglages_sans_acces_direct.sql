-- Les réglages de L'Onde ne se lisent et ne se modifient que par onde_lien_don() / onde_regler_lien_don().
REVOKE ALL ON public.onde_reglages FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.onde_reglages TO service_role;