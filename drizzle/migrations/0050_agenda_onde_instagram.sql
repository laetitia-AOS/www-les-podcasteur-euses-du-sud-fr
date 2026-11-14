CREATE TABLE public.evenements_instagram (
  evenement_id uuid PRIMARY KEY REFERENCES public.evenements(id) ON DELETE CASCADE,
  compte text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evenements_instagram_compte_valide CHECK (
    compte ~ '^@[a-z0-9._]{1,30}$' AND compte !~ '\.\.' AND compte !~ '^@\.' AND compte !~ '\.$'
  )
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evenements_instagram TO authenticated;
GRANT ALL ON public.evenements_instagram TO service_role;
ALTER TABLE public.evenements_instagram ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins lisent les comptes Instagram" ON public.evenements_instagram FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins ajoutent les comptes Instagram" ON public.evenements_instagram FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins modifient les comptes Instagram" ON public.evenements_instagram FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins retirent les comptes Instagram" ON public.evenements_instagram FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.evenements_instagram_propre()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.compte := lower(btrim(NEW.compte));
  IF NEW.compte !~ '^@' THEN NEW.compte := '@' || NEW.compte; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER evenements_instagram_propre BEFORE INSERT OR UPDATE ON public.evenements_instagram
  FOR EACH ROW EXECUTE FUNCTION public.evenements_instagram_propre();

-- Agenda → L'Onde du Sud : ajoute ou retire un événement du prochain numéro en préparation.
-- Réservé aux admins (pas aux éditeur·ices). Seuls les brouillons sont modifiés, jamais un numéro publié.
CREATE OR REPLACE FUNCTION public.onde_agenda_basculer(_evenement_id uuid, _ajouter boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  n record;
  ev text := _evenement_id::text;
  pos integer;
  nb integer;
  nbloc jsonb;
  retires jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Réservé aux admins.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.evenements e WHERE e.id = _evenement_id) THEN
    RETURN jsonb_build_object('code', 'introuvable');
  END IF;

  IF _ajouter THEN
    SELECT o.id, o.numero, o.blocs INTO n FROM public.onde_numeros o
      WHERE o.statut = 'brouillon' ORDER BY o.mois, o.numero LIMIT 1 FOR UPDATE;
    IF n.id IS NULL THEN RETURN jsonb_build_object('code', 'aucun_brouillon'); END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(n.blocs, '[]'::jsonb)) b
               WHERE b->>'type' = 'evenements' AND coalesce(b->'evenements', '[]'::jsonb) ? ev) THEN
      RETURN jsonb_build_object('code', 'deja', 'numero', n.numero, 'numero_id', n.id);
    END IF;
    SELECT (t.ord - 1)::int, jsonb_array_length(coalesce(t.b->'evenements', '[]'::jsonb)) INTO pos, nb
      FROM jsonb_array_elements(coalesce(n.blocs, '[]'::jsonb)) WITH ORDINALITY AS t(b, ord)
      WHERE t.b->>'type' = 'evenements' ORDER BY t.ord LIMIT 1;
    IF pos IS NOT NULL THEN
      IF nb >= 8 THEN RETURN jsonb_build_object('code', 'plein', 'numero', n.numero, 'numero_id', n.id); END IF;
      UPDATE public.onde_numeros SET blocs = jsonb_set(blocs, ARRAY[pos::text, 'evenements'],
        coalesce(blocs->pos->'evenements', '[]'::jsonb) || jsonb_build_array(ev)) WHERE id = n.id;
      RETURN jsonb_build_object('code', 'ajoute', 'numero', n.numero, 'numero_id', n.id, 'bloc_cree', false);
    END IF;
    IF jsonb_array_length(coalesce(n.blocs, '[]'::jsonb)) >= 30 THEN
      RETURN jsonb_build_object('code', 'trop_de_blocs', 'numero', n.numero, 'numero_id', n.id);
    END IF;
    nbloc := jsonb_build_object('id', gen_random_uuid()::text, 'type', 'evenements', 'rubrique', 'À l''agenda', 'evenements', jsonb_build_array(ev));
    UPDATE public.onde_numeros SET blocs = coalesce(blocs, '[]'::jsonb) || jsonb_build_array(nbloc) WHERE id = n.id;
    RETURN jsonb_build_object('code', 'ajoute', 'numero', n.numero, 'numero_id', n.id, 'bloc_cree', true);
  END IF;

  -- Retrait : tous les brouillons qui contiennent l'événement ; un bloc « À l'agenda » vidé et sans résumé disparaît.
  FOR n IN SELECT o.id, o.numero, o.blocs FROM public.onde_numeros o
    WHERE o.statut = 'brouillon'
      AND EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(o.blocs, '[]'::jsonb)) b
                  WHERE b->>'type' = 'evenements' AND coalesce(b->'evenements', '[]'::jsonb) ? ev)
    ORDER BY o.mois, o.numero FOR UPDATE
  LOOP
    UPDATE public.onde_numeros SET blocs = coalesce((
      SELECT jsonb_agg(x.nb ORDER BY x.ord) FROM (
        SELECT t.ord,
          CASE WHEN t.b->>'type' = 'evenements'
            THEN jsonb_set(t.b, '{evenements}', coalesce((SELECT jsonb_agg(e) FROM jsonb_array_elements(coalesce(t.b->'evenements', '[]'::jsonb)) e WHERE e #>> '{}' <> ev), '[]'::jsonb))
            ELSE t.b END AS nb
        FROM jsonb_array_elements(n.blocs) WITH ORDINALITY AS t(b, ord)
      ) x
      WHERE NOT (x.nb->>'type' = 'evenements' AND jsonb_array_length(x.nb->'evenements') = 0 AND coalesce(btrim(x.nb->>'resume'), '') = '')
    ), '[]'::jsonb) WHERE id = n.id;
    retires := retires || jsonb_build_array(n.numero);
  END LOOP;
  RETURN jsonb_build_object('code', CASE WHEN jsonb_array_length(retires) > 0 THEN 'retire' ELSE 'absent' END, 'numeros', retires);
END $$;

-- Pour l'admin de l'agenda : prochain numéro en préparation et numéros qui contiennent chaque événement.
CREATE OR REPLACE FUNCTION public.onde_agenda_etat()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Réservé aux admins.' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'prochain', (SELECT jsonb_build_object('id', o.id, 'numero', o.numero, 'mois', o.mois) FROM public.onde_numeros o
                 WHERE o.statut = 'brouillon' ORDER BY o.mois, o.numero LIMIT 1),
    'liens', coalesce((
      SELECT jsonb_agg(DISTINCT jsonb_build_object('evenement_id', e #>> '{}', 'numero', o.numero, 'statut', o.statut))
      FROM public.onde_numeros o
      CROSS JOIN LATERAL jsonb_array_elements(coalesce(o.blocs, '[]'::jsonb)) b
      CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(b->'evenements') = 'array' THEN b->'evenements' ELSE '[]'::jsonb END) e
      WHERE b->>'type' = 'evenements'
    ), '[]'::jsonb)
  );
END $$;

REVOKE ALL ON FUNCTION public.onde_agenda_basculer(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.onde_agenda_etat() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onde_agenda_basculer(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.onde_agenda_etat() TO authenticated;
REVOKE ALL ON FUNCTION public.evenements_instagram_propre() FROM PUBLIC, anon, authenticated;