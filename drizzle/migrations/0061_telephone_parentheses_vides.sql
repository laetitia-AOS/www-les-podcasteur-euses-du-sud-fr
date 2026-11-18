CREATE OR REPLACE FUNCTION public.pds_tel(v text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
-- Le téléphone est facultatif et ne bloque jamais un envoi : on garde chiffres, +, (, ), ., - et espaces
-- (« 06/12/34/56/78 » devient « 06 12 34 56 78 ») ; sans au moins 6 chiffres, le champ est laissé vide.
DECLARE s text := public.pds_txt(left(v, 200), 200, 'Téléphone', false);
BEGIN
  IF s IS NULL THEN RETURN NULL; END IF;
  s := regexp_replace(s, '[^0-9+(). -]', ' ', 'g');
  s := regexp_replace(s, '\([^0-9]*\)', ' ', 'g');
  s := btrim(regexp_replace(s, '\s+', ' ', 'g'));
  s := btrim(left(s, 30));
  IF char_length(regexp_replace(s, '[^0-9]', '', 'g')) < 6 THEN RETURN NULL; END IF;
  RETURN s;
END $function$;