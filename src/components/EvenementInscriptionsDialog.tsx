import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Users, Mail, Phone } from "lucide-react";

interface Props {
  evenementId: string | null;
  evenementTitre?: string;
  open: boolean;
  onClose: () => void;
}

const EvenementInscriptionsDialog = ({ evenementId, evenementTitre, open, onClose }: Props) => {
  const { data: inscriptions, isLoading } = useQuery({
    queryKey: ["inscriptions", evenementId],
    queryFn: async () => {
      if (!evenementId) return [];
      const { data, error } = await supabase
        .from("evenement_inscriptions")
        .select("*")
        .eq("evenement_id", evenementId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!evenementId && open,
  });

  const exportCSV = () => {
    if (!inscriptions?.length) return;
    const headers = ["Date inscription", "Prénom", "Nom", "Email", "Téléphone", "Structure"];
    const rows = inscriptions.map((i: any) => [
      new Date(i.created_at).toLocaleString("fr-FR"),
      i.prenom, i.nom, i.email, i.telephone || "", i.structure || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inscriptions_${evenementTitre?.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "evenement"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-bleu" />
            Inscriptions — {evenementTitre}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between pb-3 border-b">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Chargement…" : `${inscriptions?.length ?? 0} inscription${(inscriptions?.length ?? 0) > 1 ? "s" : ""}`}
          </p>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!inscriptions?.length}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !inscriptions?.length ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Aucune inscription pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-2 pt-3">
            {inscriptions.map((i: any) => (
              <div key={i.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {i.prenom} {i.nom}
                    </p>
                    {i.structure && <p className="text-xs text-muted-foreground">{i.structure}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1 hover:text-bleu">
                        <Mail className="w-3.5 h-3.5" /> {i.email}
                      </a>
                      {i.telephone && (
                        <a href={`tel:${i.telephone}`} className="inline-flex items-center gap-1 hover:text-bleu">
                          <Phone className="w-3.5 h-3.5" /> {i.telephone}
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(i.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EvenementInscriptionsDialog;
