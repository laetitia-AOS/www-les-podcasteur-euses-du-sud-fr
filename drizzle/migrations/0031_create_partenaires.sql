CREATE TABLE public.partenaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  site_url text,
  logo_url text,
  accroche text,
  description text,
  ordre integer NOT NULL DEFAULT 0,
  publie boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partenaires TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partenaires TO authenticated;
GRANT ALL ON public.partenaires TO service_role;

ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partenaires publiés visibles par tous"
ON public.partenaires FOR SELECT TO anon, authenticated
USING (publie = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins ajoutent des partenaires"
ON public.partenaires FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins modifient les partenaires"
ON public.partenaires FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins suppriment les partenaires"
ON public.partenaires FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.guard_partenaires()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.nom := public.pds_txt(NEW.nom, 120, 'Nom', true);
  NEW.site_url := public.pds_url(NEW.site_url, 'Site internet', 500);
  NEW.logo_url := public.pds_url(NEW.logo_url, 'Logo', 1000);
  NEW.accroche := public.pds_txt(NEW.accroche, 90, 'Accroche', false);
  NEW.description := public.pds_txt(NEW.description, 800, 'Description du partenariat', false);
  IF NEW.ordre IS NULL THEN NEW.ordre := 0; END IF;
  NEW.updated_at := now();
  IF TG_OP = 'UPDATE' THEN NEW.created_at := OLD.created_at; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER guard_partenaires
BEFORE INSERT OR UPDATE ON public.partenaires
FOR EACH ROW EXECUTE FUNCTION public.guard_partenaires();

CREATE INDEX partenaires_ordre_idx ON public.partenaires (ordre, nom);