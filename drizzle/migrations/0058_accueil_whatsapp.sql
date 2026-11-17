-- Liste fermée des départements acceptés pour l'accueil
CREATE OR REPLACE FUNCTION public.accueil_departement_valide(_d text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT _d = ANY (ARRAY['04','05','06','13','83','84','2A','2B','MC','autre']);
$$;

-- Groupes WhatsApp
CREATE TABLE public.whatsapp_groupes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  lien text NOT NULL,
  departements text[] NOT NULL DEFAULT '{}',
  par_defaut boolean NOT NULL DEFAULT false,
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX whatsapp_groupes_un_seul_defaut ON public.whatsapp_groupes ((true)) WHERE par_defaut;
REVOKE ALL ON public.whatsapp_groupes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_groupes TO authenticated;
GRANT ALL ON public.whatsapp_groupes TO service_role;
ALTER TABLE public.whatsapp_groupes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.guard_whatsapp_groupes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d text; propres text[] := '{}';
BEGIN
  NEW.nom := btrim(regexp_replace(coalesce(NEW.nom, ''), '[\u0000-\u001f\u007f<>]', '', 'g'));
  IF length(NEW.nom) < 2 OR length(NEW.nom) > 80 THEN
    RAISE EXCEPTION 'Le nom du groupe doit faire entre 2 et 80 caractères.' USING ERRCODE = 'check_violation';
  END IF;
  NEW.lien := btrim(coalesce(NEW.lien, ''));
  NEW.lien := regexp_replace(NEW.lien, '[?#].*$', '');
  IF NEW.lien !~ '^https://chat\.whatsapp\.com/[A-Za-z0-9]{10,40}$' THEN
    RAISE EXCEPTION 'Le lien doit être un lien d''invitation WhatsApp (https://chat.whatsapp.com/…).' USING ERRCODE = 'check_violation';
  END IF;
  FOREACH d IN ARRAY coalesce(NEW.departements, '{}') LOOP
    d := btrim(d);
    IF NOT public.accueil_departement_valide(d) THEN
      RAISE EXCEPTION 'Département inconnu : %', left(d, 10) USING ERRCODE = 'check_violation';
    END IF;
    IF NOT d = ANY (propres) THEN propres := propres || d; END IF;
  END LOOP;
  NEW.departements := propres;
  NEW.ordre := greatest(0, least(coalesce(NEW.ordre, 0), 1000));
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN NEW.created_at := now(); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_whatsapp_groupes BEFORE INSERT OR UPDATE ON public.whatsapp_groupes
  FOR EACH ROW EXECUTE FUNCTION public.guard_whatsapp_groupes();

CREATE POLICY "Admins lisent les groupes WhatsApp" ON public.whatsapp_groupes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins ajoutent des groupes WhatsApp" ON public.whatsapp_groupes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins modifient les groupes WhatsApp" ON public.whatsapp_groupes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins suppriment des groupes WhatsApp" ON public.whatsapp_groupes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Suivi d'accueil, une ligne par personne (adresse e-mail en minuscules)
CREATE TABLE public.membres_accueil (
  email text PRIMARY KEY,
  departement text,
  whatsapp_rejoint_le timestamptz,
  bienvenue_le timestamptz,
  bienvenue_motif text,
  relance_le timestamptz,
  invitation_le timestamptz,
  relances_refusees_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.membres_accueil FROM anon;
REVOKE ALL ON public.membres_accueil FROM authenticated;
GRANT SELECT ON public.membres_accueil TO authenticated;
GRANT ALL ON public.membres_accueil TO service_role;
ALTER TABLE public.membres_accueil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chacun·e lit son propre suivi d'accueil" ON public.membres_accueil FOR SELECT TO authenticated
  USING (email = lower(coalesce(auth.email(), '')) OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.guard_membres_accueil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));
  IF NEW.email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' OR length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Adresse e-mail invalide.' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.departement IS NOT NULL AND NOT public.accueil_departement_valide(NEW.departement) THEN
    RAISE EXCEPTION 'Département inconnu.' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.bienvenue_motif IS NOT NULL AND NEW.bienvenue_motif NOT IN ('profil', 'cotisation') THEN
    RAISE EXCEPTION 'Motif inconnu.' USING ERRCODE = 'check_violation';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER guard_membres_accueil BEFORE INSERT OR UPDATE ON public.membres_accueil
  FOR EACH ROW EXECUTE FUNCTION public.guard_membres_accueil();

-- Jetons des liens envoyés par e-mail : seule l'empreinte est gardée
CREATE TABLE public.accueil_jetons (
  empreinte text PRIMARY KEY,
  email text NOT NULL,
  usage text NOT NULL CHECK (usage IN ('rejoint', 'stop')),
  created_at timestamptz NOT NULL DEFAULT now(),
  utilise_le timestamptz
);
CREATE INDEX accueil_jetons_email ON public.accueil_jetons (email);
REVOKE ALL ON public.accueil_jetons FROM anon;
REVOKE ALL ON public.accueil_jetons FROM authenticated;
GRANT ALL ON public.accueil_jetons TO service_role;
ALTER TABLE public.accueil_jetons ENABLE ROW LEVEL SECURITY;

-- Invitations de rattrapage lancées par un·e admin
CREATE TABLE public.accueil_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lancee_le timestamptz NOT NULL DEFAULT now(),
  lancee_par uuid,
  terminee_le timestamptz,
  envoyes integer NOT NULL DEFAULT 0,
  erreurs integer NOT NULL DEFAULT 0,
  message text
);
CREATE UNIQUE INDEX accueil_invitations_une_en_cours ON public.accueil_invitations ((true)) WHERE terminee_le IS NULL;
REVOKE ALL ON public.accueil_invitations FROM anon;
REVOKE ALL ON public.accueil_invitations FROM authenticated;
GRANT SELECT ON public.accueil_invitations TO authenticated;
GRANT ALL ON public.accueil_invitations TO service_role;
ALTER TABLE public.accueil_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins lisent les invitations" ON public.accueil_invitations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Personne connue du site : une fiche, un paiement ou un paiement rattaché
CREATE OR REPLACE FUNCTION public.accueil_personne_connue(_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(_email, '') <> '' AND (
    EXISTS (SELECT 1 FROM public.podcasts p WHERE lower(p.email) = lower(_email))
    OR EXISTS (SELECT 1 FROM public.adhesions a WHERE lower(a.email) = lower(_email) AND a.statut IN ('active', 'a_verifier'))
    OR EXISTS (SELECT 1 FROM public.adhesion_rattachements r WHERE lower(r.email_membre) = lower(_email))
  );
$$;

-- Département d'une personne : celui qu'elle a choisi, sinon celui de sa fiche
CREATE OR REPLACE FUNCTION public.accueil_departement_de(_email text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    (SELECT m.departement FROM public.membres_accueil m WHERE m.email = lower(_email)),
    (SELECT p.department_code FROM public.podcasts p
      WHERE lower(p.email) = lower(_email) AND public.accueil_departement_valide(p.department_code)
      ORDER BY p.created_at LIMIT 1)
  );
$$;

-- Groupe d'un département (département inconnu : groupe par défaut)
CREATE OR REPLACE FUNCTION public.accueil_groupe_du_departement(_dep text)
RETURNS TABLE(groupe_id uuid, nom text, lien text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.nom, g.lien FROM public.whatsapp_groupes g
  WHERE (_dep IS NOT NULL AND _dep = ANY (g.departements)) OR g.par_defaut
  ORDER BY (_dep IS NOT NULL AND _dep = ANY (g.departements)) DESC, g.ordre, g.created_at
  LIMIT 1;
$$;

-- Espace membre et page de bienvenue : son département, son groupe (seulement si le département est connu)
CREATE OR REPLACE FUNCTION public.mon_accueil()
RETURNS TABLE(departement text, groupe_nom text, groupe_lien text, whatsapp_rejoint_le timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE e text := lower(coalesce(auth.email(), '')); d text;
BEGIN
  IF e = '' OR NOT public.accueil_personne_connue(e) THEN RETURN; END IF;
  d := public.accueil_departement_de(e);
  RETURN QUERY
    SELECT d,
      CASE WHEN d IS NOT NULL THEN (SELECT g.nom FROM public.accueil_groupe_du_departement(d) g) END,
      CASE WHEN d IS NOT NULL THEN (SELECT g.lien FROM public.accueil_groupe_du_departement(d) g) END,
      (SELECT m.whatsapp_rejoint_le FROM public.membres_accueil m WHERE m.email = e);
END $$;

CREATE OR REPLACE FUNCTION public.definir_mon_departement(_departement text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e text := lower(coalesce(auth.email(), ''));
BEGIN
  IF e = '' OR NOT public.accueil_personne_connue(e) THEN
    RAISE EXCEPTION 'Aucun profil ni adhésion avec cette adresse.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NOT public.accueil_departement_valide(_departement) THEN
    RAISE EXCEPTION 'Choisis un département dans la liste.' USING ERRCODE = 'check_violation';
  END IF;
  INSERT INTO public.membres_accueil (email, departement) VALUES (e, _departement)
  ON CONFLICT (email) DO UPDATE SET departement = EXCLUDED.departement;
END $$;

CREATE OR REPLACE FUNCTION public.j_ai_rejoint_whatsapp()
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e text := lower(coalesce(auth.email(), '')); r timestamptz;
BEGIN
  IF e = '' OR NOT public.accueil_personne_connue(e) THEN
    RAISE EXCEPTION 'Aucun profil ni adhésion avec cette adresse.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO public.membres_accueil (email, whatsapp_rejoint_le) VALUES (e, now())
  ON CONFLICT (email) DO UPDATE SET whatsapp_rejoint_le = coalesce(public.membres_accueil.whatsapp_rejoint_le, now())
  RETURNING whatsapp_rejoint_le INTO r;
  RETURN r;
END $$;

-- Jetons : création (serveur seulement) et utilisation (lien d'un e-mail, sans connexion)
CREATE OR REPLACE FUNCTION public.accueil_jeton_creer(_email text, _usage text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE j text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
BEGIN
  IF _usage NOT IN ('rejoint', 'stop') THEN RAISE EXCEPTION 'Usage inconnu'; END IF;
  INSERT INTO public.accueil_jetons (empreinte, email, usage)
  VALUES (encode(sha256(convert_to(j, 'UTF8')), 'hex'), lower(btrim(_email)), _usage);
  RETURN j;
END $$;

CREATE OR REPLACE FUNCTION public.accueil_jeton_utiliser(_jeton text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.accueil_jetons%ROWTYPE;
BEGIN
  IF _jeton IS NULL OR _jeton !~ '^[0-9a-f]{64}$' THEN RETURN 'invalide'; END IF;
  SELECT * INTO t FROM public.accueil_jetons WHERE empreinte = encode(sha256(convert_to(_jeton, 'UTF8')), 'hex') FOR UPDATE;
  IF NOT FOUND OR t.created_at < now() - interval '180 days' THEN RETURN 'invalide'; END IF;
  IF t.utilise_le IS NOT NULL THEN RETURN 'deja'; END IF;
  UPDATE public.accueil_jetons SET utilise_le = now() WHERE empreinte = t.empreinte;
  IF t.usage = 'rejoint' THEN
    INSERT INTO public.membres_accueil (email, whatsapp_rejoint_le) VALUES (t.email, now())
    ON CONFLICT (email) DO UPDATE SET whatsapp_rejoint_le = coalesce(public.membres_accueil.whatsapp_rejoint_le, now());
  ELSE
    INSERT INTO public.membres_accueil (email, relances_refusees_le) VALUES (t.email, now())
    ON CONFLICT (email) DO UPDATE SET relances_refusees_le = coalesce(public.membres_accueil.relances_refusees_le, now());
  END IF;
  RETURN t.usage;
END $$;

-- Bienvenue : réservée une seule fois par personne (renvoie vrai si elle part maintenant)
CREATE OR REPLACE FUNCTION public.accueil_bienvenue_reserver(_email text, _motif text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  INSERT INTO public.membres_accueil (email, bienvenue_le, bienvenue_motif) VALUES (lower(btrim(_email)), now(), _motif)
  ON CONFLICT (email) DO UPDATE SET bienvenue_le = now(), bienvenue_motif = EXCLUDED.bienvenue_motif
    WHERE public.membres_accueil.bienvenue_le IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END $$;

CREATE OR REPLACE FUNCTION public.accueil_bienvenue_annuler(_email text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.membres_accueil SET bienvenue_le = NULL, bienvenue_motif = NULL
  WHERE email = lower(btrim(_email)) AND bienvenue_le > now() - interval '10 minutes';
$$;

-- Relance unique, 7 jours après la bienvenue, si la personne n'a pas cliqué « J'ai rejoint »
CREATE OR REPLACE FUNCTION public.accueil_relances_dues()
RETURNS TABLE(email text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.email FROM public.membres_accueil m
  WHERE m.bienvenue_le <= now() - interval '7 days' AND m.bienvenue_le > now() - interval '30 days'
    AND m.relance_le IS NULL AND m.whatsapp_rejoint_le IS NULL AND m.relances_refusees_le IS NULL
  ORDER BY m.bienvenue_le LIMIT 200;
$$;

-- Rattrapage : adhérent·es à jour qui n'ont ni rejoint, ni reçu la bienvenue ou une invitation, ni refusé les relances
CREATE OR REPLACE FUNCTION public.accueil_invitation_cibles()
RETURNS TABLE(email text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH gens AS (
    SELECT DISTINCT lower(a.email) AS e FROM public.adhesions a WHERE a.email IS NOT NULL AND a.statut = 'active'
    UNION
    SELECT DISTINCT lower(r.email_membre) FROM public.adhesion_rattachements r
  )
  SELECT g.e FROM gens g
  LEFT JOIN public.membres_accueil m ON m.email = g.e
  WHERE public.membre_a_jour(g.e)
    AND g.e !~ '@invalid$'
    AND m.whatsapp_rejoint_le IS NULL AND m.bienvenue_le IS NULL AND m.invitation_le IS NULL AND m.relances_refusees_le IS NULL
  ORDER BY g.e;
$$;

CREATE OR REPLACE FUNCTION public.accueil_marquer(_email text, _quoi text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _quoi = 'relance' THEN
    INSERT INTO public.membres_accueil (email, relance_le) VALUES (lower(_email), now())
    ON CONFLICT (email) DO UPDATE SET relance_le = now();
  ELSIF _quoi = 'invitation' THEN
    INSERT INTO public.membres_accueil (email, invitation_le) VALUES (lower(_email), now())
    ON CONFLICT (email) DO UPDATE SET invitation_le = now();
  ELSE
    RAISE EXCEPTION 'Inconnu';
  END IF;
END $$;

-- Admin : suivi de chaque personne de la liste des membres
CREATE OR REPLACE FUNCTION public.admin_accueil()
RETURNS TABLE(email text, nom text, etat text, departement text, departement_choisi boolean, groupe_nom text,
  whatsapp_rejoint_le timestamptz, bienvenue_le timestamptz, relance_le timestamptz, invitation_le timestamptz, relances_refusees_le timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN; END IF;
  RETURN QUERY
    WITH b AS (SELECT am.email AS e, am.nom AS n, am.etat AS et, public.accueil_departement_de(am.email) AS d FROM public.admin_membres() am)
    SELECT b.e, b.n, b.et, b.d, (m.departement IS NOT NULL),
      CASE WHEN b.d IS NOT NULL THEN (SELECT g.nom FROM public.accueil_groupe_du_departement(b.d) g) END,
      m.whatsapp_rejoint_le, m.bienvenue_le, m.relance_le, m.invitation_le, m.relances_refusees_le
    FROM b LEFT JOIN public.membres_accueil m ON m.email = b.e
    ORDER BY b.n;
END $$;

CREATE OR REPLACE FUNCTION public.admin_accueil_invitation_nombre()
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN NULL; END IF;
  RETURN (SELECT count(*)::int FROM public.accueil_invitation_cibles());
END $$;

-- Droits : les fonctions internes ne sont appelables que par le serveur
REVOKE ALL ON FUNCTION public.accueil_personne_connue(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accueil_departement_de(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accueil_groupe_du_departement(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accueil_jeton_creer(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accueil_bienvenue_reserver(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accueil_bienvenue_annuler(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accueil_relances_dues() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accueil_invitation_cibles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accueil_marquer(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accueil_personne_connue(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.accueil_departement_de(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.accueil_groupe_du_departement(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.accueil_jeton_creer(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.accueil_bienvenue_reserver(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.accueil_bienvenue_annuler(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.accueil_relances_dues() TO service_role;
GRANT EXECUTE ON FUNCTION public.accueil_invitation_cibles() TO service_role;
GRANT EXECUTE ON FUNCTION public.accueil_marquer(text, text) TO service_role;

REVOKE ALL ON FUNCTION public.mon_accueil() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.definir_mon_departement(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.j_ai_rejoint_whatsapp() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_accueil() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_accueil_invitation_nombre() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_accueil() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.definir_mon_departement(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.j_ai_rejoint_whatsapp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_accueil() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_accueil_invitation_nombre() TO authenticated;

REVOKE ALL ON FUNCTION public.accueil_jeton_utiliser(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accueil_jeton_utiliser(text) TO anon, authenticated, service_role;
