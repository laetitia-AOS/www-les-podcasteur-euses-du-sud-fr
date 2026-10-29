-- Même règle, à une date donnée (sert aux tests de la tolérance de janvier)
CREATE OR REPLACE FUNCTION public.membre_a_jour_le(_email text, _quand timestamptz)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH t AS (SELECT extract(year FROM (_quand AT TIME ZONE 'Europe/Paris'))::int AS y, extract(month FROM (_quand AT TIME ZONE 'Europe/Paris'))::int AS m),
  c AS (SELECT public.annee_couverte(_email) AS a)
  SELECT coalesce((SELECT a FROM c) >= (SELECT y FROM t)
    OR ((SELECT m FROM t) = 1 AND (SELECT a FROM c) = (SELECT y FROM t) - 1), false)
$function$;
REVOKE ALL ON FUNCTION public.membre_a_jour_le(text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.membre_a_jour_le(text, timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.membre_a_jour(_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.membre_a_jour_le(_email, now())
$function$;