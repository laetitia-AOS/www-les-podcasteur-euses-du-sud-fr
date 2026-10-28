REVOKE ALL ON public.contact_requests FROM anon;
REVOKE INSERT, TRUNCATE, REFERENCES, TRIGGER ON public.contact_requests FROM authenticated;