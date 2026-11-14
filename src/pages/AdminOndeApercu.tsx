import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import NumeroVue from "@/components/onde/NumeroVue";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { container, linkUnderline } from "@/lib/pds";
import { NOM_ONDE, ONDE_COLUMNS_EQUIPE, fichiersNumero, ondeHref, useFichiersEquipe, type NumeroOnde } from "@/lib/onde";

/** Aperçu d'un numéro, tel qu'il sera publié (brouillon compris). Réservé à l'équipe, jamais référencé. */
const AdminOndeApercu = () => {
  const { id } = useParams();
  const { user, isAdmin, isEditeur, loading } = useAdminAuth();
  const autorise = isAdmin || isEditeur;

  const { data: n, isLoading } = useQuery({
    queryKey: ["onde-apercu", id],
    enabled: autorise && !!id,
    queryFn: async (): Promise<NumeroOnde | null> => {
      const { data, error } = await supabase.from("onde_numeros").select(ONDE_COLUMNS_EQUIPE).eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as unknown as NumeroOnde) ?? null;
    },
  });
  const resoudre = useFichiersEquipe(n ? fichiersNumero(n) : []);

  const seo = <SEOHead title={`Aperçu — ${NOM_ONDE}`} description="Aperçu d'un numéro de L'Onde du Sud, réservé à l'équipe." path={`/admin/onde/${id}/apercu`} noindex />;

  if (loading || (autorise && isLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {seo}
        <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
      </div>
    );
  }
  if (!user || !autorise) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      {seo}
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className="bg-accent text-accent-foreground" role="status">
          <p className={`${container} py-3 text-[15px] font-bold`}>
            {!n
              ? "Ce numéro est introuvable."
              : n.statut === "publie"
                ? <>Aperçu de la version enregistrée. Ce numéro est en ligne : <Link to={ondeHref(n.slug)} className={linkUnderline}>voir la page publique</Link>.</>
                : "Aperçu : ce numéro est un brouillon, il n'est pas encore sur le site."}
            {" "}<Link to={`/admin/onde/${id}`} className={linkUnderline}>Revenir à l'éditeur</Link>
          </p>
        </div>
        {n && <NumeroVue n={n} resoudre={resoudre} />}
      </main>
      <Footer />
    </div>
  );
};

export default AdminOndeApercu;
