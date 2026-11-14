import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { NOM_ONDE, ondeHref } from "@/lib/onde";
import { PAGES } from "@/lib/seo";
import { cibleLienCourt } from "@/lib/ondePied";

/** Lien court imprimé dans la version PDF : /o/1 (version audio du n°1), /o/1/02 (son du bloc 02) → page du numéro publié. */
const OndeLienCourt = () => {
  const { numero, bloc } = useParams();
  const cible = cibleLienCourt(numero, bloc);
  const { data: slug, isLoading } = useQuery({
    queryKey: ["onde-lien-court", cible?.numero],
    enabled: !!cible,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.from("onde_numeros").select("slug").eq("numero", cible!.numero).eq("statut", "publie").maybeSingle();
      if (error) throw error;
      return (data?.slug as string | undefined) ?? null;
    },
  });
  if (!cible || (!isLoading && !slug)) return <Navigate to={PAGES.onde} replace />;
  if (isLoading || !slug) {
    return (
      <>
        <SEOHead title={`${NOM_ONDE}`} description="Lien court vers un numéro de L'Onde du Sud, la lettre mensuelle des Podcasteur·euses du Sud." path={`/o/${numero}`} noindex />
        <p className="pt-32 text-center font-mono text-muted-foreground">Ouverture du numéro…</p>
      </>
    );
  }
  return <Navigate to={`${ondeHref(slug)}#${cible.ancre}`} replace />;
};

export default OndeLienCourt;
