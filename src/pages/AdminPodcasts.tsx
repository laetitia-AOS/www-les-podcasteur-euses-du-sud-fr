import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mic, ArrowLeft, LogOut, Loader2, Download, Eye, EyeOff, ExternalLink, Trash2 } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AdminPodcasts = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAdminAuth();
  const queryClient = useQueryClient();
  const [selectedPodcast, setSelectedPodcast] = useState<any>(null);

  const { data: podcasts, isLoading } = useQuery({
    queryKey: ["admin-podcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const toggleValide = useMutation({
    mutationFn: async ({ id, valide }: { id: string; valide: boolean }) => {
      const { error } = await supabase
        .from("podcasts")
        .update({ valide })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { valide }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-podcasts"] });
      toast.success(valide ? "Podcast activé dans le flux" : "Podcast retiré du flux");
    },
    onError: (err: any) => {
      toast.error("Erreur : " + (err.message || "Erreur inconnue"));
    },
  });

  const deletePodcast = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("podcasts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-podcasts"] });
      toast.success("Fiche podcast supprimée");
    },
    onError: (err: any) => {
      toast.error("Erreur : " + (err.message || "Erreur inconnue"));
    },
  });

  const exportCSV = () => {
    if (!podcasts?.length) return;
    const headers = [
      "Date", "Nom podcast", "Prénom", "Nom", "Email", "Téléphone",
      "Thématique", "Type", "Ville", "Département", "Lien écoute",
      "Fréquence", "Niveau", "Priorité", "Besoins", "Monétisé",
      "Score fiche", "Score dynamique", "Score opportunité", "Score global", "Segment",
      "Consent contact", "Consent mise en relation", "Validé",
    ];
    const rows = podcasts.map((p) => [
      new Date(p.created_at).toLocaleDateString("fr-FR"),
      p.nom_podcast, p.prenom || "", p.nom || "", p.email, p.telephone || "",
      p.thematique || "", p.type_podcast || "", p.city_name || p.ville || "",
      p.department_label || "", p.lien_ecoute, p.frequence_publication || "",
      p.niveau_avancement || "", p.priorite_actuelle || "",
      (p.besoins_podcast || []).join(", "), p.monetise || "",
      p.score_fiche, p.score_dynamique, p.score_opportunite, p.score_global, p.segment_pds,
      p.consent_contact ? "Oui" : "Non", p.consent_mise_en_relation ? "Oui" : "Non",
      p.valide ? "Oui" : "Non",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `podcasts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const validCount = podcasts?.filter((p) => p.valide).length ?? 0;
  const totalCount = podcasts?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-3xl text-foreground flex items-center gap-2">
                <Mic className="w-7 h-7 text-primary" />
                Podcasts
              </h1>
              <p className="text-muted-foreground">
                {totalCount} fiche{totalCount > 1 ? "s" : ""} · {validCount} visible{validCount > 1 ? "s" : ""} dans le flux
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!podcasts?.length}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Déconnexion
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !podcasts?.length ? (
          <div className="text-center py-20">
            <Mic className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun podcast enregistré.</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">Visible</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Podcast</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Thématique</TableHead>
                  <TableHead>Besoins</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {podcasts.map((p) => (
                  <TableRow key={p.id} className={!p.valide ? "opacity-60" : ""}>
                    <TableCell>
                      <Switch
                        checked={p.valide}
                        onCheckedChange={(checked) =>
                          toggleValide.mutate({ id: p.id, valide: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.vignette_url && (
                          <img
                            src={p.vignette_url}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{p.nom_podcast}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <p>{p.prenom} {p.nom}</p>
                      <a href={`mailto:${p.email}`} className="text-primary text-xs hover:underline">
                        {p.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm">{p.city_name || p.ville || "—"}</TableCell>
                    <TableCell className="text-sm">{p.thematique || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {p.besoins_podcast && p.besoins_podcast.length > 0 && p.besoins_podcast[0] !== "non_specifie" ? (
                        <div className="flex flex-wrap gap-1">
                          {p.besoins_podcast.map((b: string) => (
                            <Badge key={b} variant="outline" className="text-xs">
                              {b.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{p.score_global}/100</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.segment_pds === "Ambassadeur potentiel"
                            ? "default"
                            : p.segment_pds === "Actif engagé"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs whitespace-nowrap"
                      >
                        {p.segment_pds}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPodcast(p)}
                          title="Voir le détail"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (window.confirm(`Supprimer la fiche "${p.nom_podcast}" ? Cette action est irréversible.`)) {
                              deletePodcast.mutate(p.id);
                            }
                          }}
                          title="Supprimer la fiche"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedPodcast} onOpenChange={() => setSelectedPodcast(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPodcast && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedPodcast.vignette_url && (
                    <img src={selectedPodcast.vignette_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  {selectedPodcast.nom_podcast}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <DetailRow label="Prénom" value={selectedPodcast.prenom} />
                <DetailRow label="Nom" value={selectedPodcast.nom} />
                <DetailRow label="Email" value={selectedPodcast.email} />
                <DetailRow label="Téléphone" value={selectedPodcast.telephone} />
                <DetailRow label="Structure" value={selectedPodcast.structure} />
                <DetailRow label="Ville" value={selectedPodcast.city_name || selectedPodcast.ville} />
                <DetailRow label="Département" value={selectedPodcast.department_label} />
                <DetailRow label="Code postal" value={selectedPodcast.city_postcode} />
                <DetailRow label="Thématique" value={selectedPodcast.thematique} />
                <DetailRow label="Type" value={selectedPodcast.type_podcast} />
                <DetailRow label="Fréquence" value={selectedPodcast.frequence_publication} />
                <DetailRow label="Niveau" value={selectedPodcast.niveau_avancement} />
                <DetailRow label="Monétisé" value={selectedPodcast.monetise} />
                <DetailRow label="Priorité" value={selectedPodcast.priorite_actuelle} />
                <div className="col-span-2">
                  <DetailRow
                    label="Besoins"
                    value={
                      selectedPodcast.besoins_podcast?.length
                        ? selectedPodcast.besoins_podcast.map((b: string) => b.replace(/_/g, " ")).join(", ")
                        : null
                    }
                  />
                </div>
                <div className="col-span-2">
                  <DetailRow label="Description" value={selectedPodcast.description} />
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Lien d'écoute</p>
                  <a href={selectedPodcast.lien_ecoute} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    {selectedPodcast.lien_ecoute} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <DetailRow label="Score fiche" value={`${selectedPodcast.score_fiche}/10`} />
                <DetailRow label="Score dynamique" value={`${selectedPodcast.score_dynamique}/10`} />
                <DetailRow label="Score opportunité" value={`${selectedPodcast.score_opportunite}/10`} />
                <DetailRow label="Score global" value={`${selectedPodcast.score_global}/100`} />
                <DetailRow label="Segment" value={selectedPodcast.segment_pds} />
                <DetailRow label="Consent contact" value={selectedPodcast.consent_contact ? "Oui" : "Non"} />
                <DetailRow label="Consent mise en relation" value={selectedPodcast.consent_mise_en_relation ? "Oui" : "Non"} />
                <DetailRow label="Validé (visible)" value={selectedPodcast.valide ? "Oui" : "Non"} />
                <DetailRow label="Date inscription" value={new Date(selectedPodcast.created_at).toLocaleString("fr-FR")} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="font-medium">{value || "—"}</p>
  </div>
);

export default AdminPodcasts;
