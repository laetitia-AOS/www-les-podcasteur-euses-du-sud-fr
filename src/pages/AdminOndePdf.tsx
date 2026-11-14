import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import NumeroVue from "@/components/onde/NumeroVue";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { btnPrimary, container, linkUnderline } from "@/lib/pds";
import { NOM_ONDE, ONDE_COLUMNS_EQUIPE, fichiersNumero, slugOnde, useFichiersEquipe, type NumeroOnde } from "@/lib/onde";

/** Attend que toutes les images de la page (photos, QR codes) soient prêtes. */
const imagesPretes = () =>
  Promise.all(
    Array.from(document.images).map((img) =>
      img.complete ? Promise.resolve() : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); }),
    ),
  );

/**
 * Version PDF d'un numéro (équipe de L'Onde seulement) : la page du numéro mise en page pour l'A4, chaque son
 * remplacé par un QR code et un lien court. Le PDF est fait par le navigateur (« Enregistrer au format PDF »).
 */
const AdminOndePdf = () => {
  const { id } = useParams();
  const { user, isAdmin, isEditeur, loading } = useAdminAuth();
  const autorise = isAdmin || isEditeur;
  const [pret, setPret] = useState(false);
  const imprime = useRef(false);

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

  // Nom du fichier proposé par le navigateur : « L'Onde du Sud n1-decembre-2026 »
  useEffect(() => {
    if (!n) return;
    const avant = document.title;
    document.title = `L'Onde du Sud ${n.slug || slugOnde(n.numero, n.mois)}`;
    return () => { document.title = avant; };
  }, [n]);

  // Une fois tout chargé (blocs relus, photos, QR codes), la fenêtre « Enregistrer en PDF » s'ouvre d'elle-même
  useEffect(() => {
    if (!n) return;
    let fini = false;
    const t = window.setTimeout(async () => {
      await imagesPretes();
      if (fini) return;
      setPret(true);
      if (!imprime.current) { imprime.current = true; window.print(); }
    }, 1800);
    return () => { fini = true; window.clearTimeout(t); };
  }, [n]);

  const seo = <SEOHead title={`PDF — ${NOM_ONDE}`} description="Version PDF d'un numéro de L'Onde du Sud, réservée à l'équipe." path={`/admin/onde/${id}/pdf`} noindex />;

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
    <div className="min-h-screen bg-background print:bg-surface">
      {seo}
      <div className="bg-encre text-surface print:hidden" role="status" aria-live="polite">
        <div className={`${container} py-4 flex flex-wrap items-center justify-between gap-4`}>
          <p className="text-[15px] max-w-[70ch]">
            {!n
              ? "Ce numéro est introuvable."
              : pret
                ? <>Dans la fenêtre d'impression, choisissez <strong>« Enregistrer au format PDF »</strong> comme destination, format A4.</>
                : "Préparation du PDF…"}
            {" "}<Link to={id ? `/admin/onde/${id}` : "/admin/onde"} className={`${linkUnderline} text-surface`}>Revenir à l'éditeur</Link>
          </p>
          {n && (
            <button type="button" className={btnPrimary} onClick={() => window.print()} disabled={!pret}>
              {pret ? <Printer className="w-4 h-4" aria-hidden /> : <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />}
              Télécharger en PDF
            </button>
          )}
        </div>
      </div>
      {n && (
        <main className="pt-4 print:pt-0">
          <NumeroVue n={n} resoudre={resoudre} impression />
        </main>
      )}
    </div>
  );
};

export default AdminOndePdf;
