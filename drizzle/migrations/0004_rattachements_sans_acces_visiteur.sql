REVOKE ALL ON public.adhesion_rattachements FROM anon;
REVOKE UPDATE, TRUNCATE, REFERENCES, TRIGGER ON public.adhesion_rattachements FROM authenticated;