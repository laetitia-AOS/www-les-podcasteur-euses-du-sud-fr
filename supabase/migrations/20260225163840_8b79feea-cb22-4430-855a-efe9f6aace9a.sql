-- Remove old overly-permissive service-role policies on evenements
-- They are replaced by proper admin-scoped policies
DROP POLICY IF EXISTS "Insertion evenements via service role" ON public.evenements;
DROP POLICY IF EXISTS "Update evenements via service role" ON public.evenements;
DROP POLICY IF EXISTS "Delete evenements via service role" ON public.evenements;