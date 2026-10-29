-- Fonctions de déclencheurs : jamais appelées directement depuis le site (le déclencheur s'exécute sans ce droit)
REVOKE EXECUTE ON FUNCTION public.adhesion_echeance() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.after_evenement_propose() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_validate_podcast_on_adhesion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_validate_podcast_on_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_demandes_devis() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_evenements_structure() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_evenements_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_fiches_lieux() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_podcasts_collab() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_podcasts_flux() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_podcasts_sursis_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_podcasts_update() FROM PUBLIC, anon, authenticated;