import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import SEOHead from "@/components/SEOHead";
import { useQrSvg } from "@/components/onde/impressionOnde";
import { btnPrimary, linkUnderline } from "@/lib/pds";
import logoPds from "@/assets/logo-pds.png";

/** Affiche A5 d'un groupe (à poser sur les tables des ateliers) : réservée aux admins, le lien est lu avec leurs droits. */
const AdminWhatsappAffiche = () => {
  const { id } = useParams();
  const { user, isAdmin, loading } = useAdminAuth();
  const { data: g, isLoading } = useQuery({
    queryKey: ["whatsapp-groupe", id],
    enabled: !!isAdmin && !!id,
    queryFn: async () => {
      const { data } = await supabase.from("whatsapp_groupes").select("nom, lien, departements").eq("id", id!).maybeSingle();
      return data as { nom: string; lien: string; departements: string[] } | null;
    },
  });
  const svg = useQrSvg(g?.lien || null);
  useEffect(() => {
    const st = document.createElement("style");
    st.textContent = "@media print { @page { size: A5 portrait; margin: 0; } }";
    document.head.appendChild(st);
    return () => { st.remove(); };
  }, []);
  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return (
    <div className="min-h-screen bg-background print:bg-surface">
      <SEOHead title="Affiche du groupe WhatsApp — Administration" description="Affiche imprimable réservée à l'équipe." path={`/admin/whatsapp/affiche/${id}`} noindex />
      <div className="bg-encre text-surface print:hidden">
        <div className="mx-auto max-w-[900px] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[15px]">Format A5. Dans la fenêtre d'impression, choisis A5 ou « Enregistrer au format PDF ». <Link to="/admin/whatsapp?onglet=groupes" className={`${linkUnderline} text-surface`}>Revenir aux groupes</Link></p>
          <button type="button" className={btnPrimary} onClick={() => window.print()} disabled={!svg}><Printer className="w-4 h-4" aria-hidden /> Imprimer</button>
        </div>
      </div>
      {isLoading ? <Loader2 className="m-10 w-6 h-6 animate-spin motion-reduce:animate-none" aria-label="Chargement" /> : !g ? (
        <p className="p-10">Ce groupe est introuvable.</p>
      ) : (
        <main className="mx-auto my-8 print:my-0 bg-surface border-2 border-encre print:border-0 flex flex-col" style={{ width: "148mm", height: "210mm", padding: "12mm", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          <div className="flex items-center gap-3">
            <img src={logoPds} alt="" width={48} height={48} className="w-12 h-12" />
            <p className="font-bold text-[15px] leading-tight">Les Podcasteur·euses du Sud</p>
          </div>
          <div className="h-2 bg-accent mt-5" aria-hidden />
          <h1 className="title-page text-[38px] leading-[0.95] mt-6">Rejoins le groupe WhatsApp des Podcasteur·euses du Sud</h1>
          <p className="mt-4 text-[20px] font-bold text-primary">{g.nom}</p>
          <div className="flex-1 flex items-center justify-center">
            {svg ? <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`QR code du groupe ${g.nom}`} style={{ width: "78mm", height: "78mm" }} /> : null}
          </div>
          <p className="text-[15px]">Scanne le code avec l'appareil photo de ton téléphone.</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">les-podcasteur-euses-du-sud.fr</p>
        </main>
      )}
    </div>
  );
};

export default AdminWhatsappAffiche;
