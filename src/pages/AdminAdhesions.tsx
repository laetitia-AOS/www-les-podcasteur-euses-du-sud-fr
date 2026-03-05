import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ArrowLeft, LogOut, Loader2, Download, RefreshCw, Trash2, Pencil, Save, X } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AddAdhesionDialog from "@/components/AddAdhesionDialog";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getAdhesionDate = (a: any) =>
  a.date_adhesion ? new Date(a.date_adhesion) : new Date(a.created_at);

const AdminAdhesions = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAdminAuth();
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();
  const [editingAdhesion, setEditingAdhesion] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  const importFromHelloAsso = async () => {
    setImporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Non authentifié");
      const { data, error } = await supabase.functions.invoke("helloasso-import", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      toast.success(`Import terminé : ${data.imported} ajoutée(s), ${data.skipped} déjà présente(s)`);
      queryClient.invalidateQueries({ queryKey: ["adhesions"] });
    } catch (err: any) {
      toast.error("Erreur d'import : " + (err.message || "Erreur inconnue"));
    } finally {
      setImporting(false);
    }
  };

  const { data: adhesions, isLoading } = useQuery({
    queryKey: ["adhesions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adhesions")
        .select("*")
        .order("date_adhesion", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const deleteAdhesion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("adhesions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adhesions"] });
      toast.success("Adhésion supprimée");
    },
    onError: (err: any) => toast.error("Erreur : " + (err.message || "Erreur inconnue")),
  });

  const updateAdhesion = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("adhesions").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adhesions"] });
      toast.success("Adhésion modifiée");
      setEditingAdhesion(null);
    },
    onError: (err: any) => toast.error("Erreur : " + (err.message || "Erreur inconnue")),
  });

  const startEdit = (a: any) => {
    setEditingAdhesion(a);
    setEditForm({
      prenom: a.prenom || "",
      nom: a.nom || "",
      email: a.email || "",
      telephone: a.telephone || "",
      montant: a.montant ?? "",
      type_adhesion: a.type_adhesion || "",
      statut: a.statut || "active",
    });
  };

  const handleSaveEdit = () => {
    if (!editingAdhesion) return;
    updateAdhesion.mutate({
      id: editingAdhesion.id,
      data: {
        prenom: editForm.prenom || null,
        nom: editForm.nom || null,
        email: editForm.email || null,
        telephone: editForm.telephone || null,
        montant: editForm.montant ? Number(editForm.montant) : null,
        type_adhesion: editForm.type_adhesion || null,
        statut: editForm.statut,
      },
    });
  };

  const { activeAdhesions, expiredByYear } = useMemo(() => {
    if (!adhesions) return { activeAdhesions: [], expiredByYear: {} as Record<string, any[]> };
    const active = adhesions.filter((a: any) => a.statut === "active");
    const expired = adhesions.filter((a: any) => a.statut !== "active");
    const byYear: Record<string, any[]> = {};
    expired.forEach((a: any) => {
      const year = String(getAdhesionDate(a).getFullYear());
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(a);
    });
    const sorted: Record<string, any[]> = {};
    Object.keys(byYear).sort((a, b) => Number(b) - Number(a)).forEach(y => { sorted[y] = byYear[y]; });
    return { activeAdhesions: active, expiredByYear: sorted };
  }, [adhesions]);

  const expiredYears = Object.keys(expiredByYear);

  const exportCSV = () => {
    if (!adhesions?.length) return;
    const headers = ["Date", "Prénom", "Nom", "Email", "Téléphone", "Montant", "Type", "Statut"];
    const rows = adhesions.map((a: any) => [
      getAdhesionDate(a).toLocaleDateString("fr-FR"),
      a.prenom || "", a.nom || "", a.email || "", a.telephone || "",
      a.montant ?? "", a.type_adhesion || "", a.statut,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `adhesions_${new Date().toISOString().slice(0, 10)}.csv`;
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

  const AdhesionTable = ({ items }: { items: any[] }) => (
    <div className="border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a: any) => (
            <TableRow key={a.id}>
              <TableCell className="text-sm whitespace-nowrap">
                {getAdhesionDate(a).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell>{a.prenom || "—"}</TableCell>
              <TableCell>{a.nom || "—"}</TableCell>
              <TableCell className="text-sm">{a.email || "—"}</TableCell>
              <TableCell className="text-sm">
                {a.telephone ? (
                  <a href={`https://wa.me/${a.telephone.replace(/\s+/g, '').replace(/^0/, '33')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {a.telephone}
                  </a>
                ) : "—"}
              </TableCell>
              <TableCell>{a.montant ? `${a.montant} €` : "—"}</TableCell>
              <TableCell className="text-sm">{a.type_adhesion || "—"}</TableCell>
              <TableCell>
                <Badge variant={a.statut === "active" ? "default" : "secondary"}>{a.statut}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(a)} title="Modifier">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (window.confirm(`Supprimer l'adhésion de ${a.prenom} ${a.nom} ?`)) {
                        deleteAdhesion.mutate(a.id);
                      }
                    }}
                    title="Supprimer"
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
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-3xl text-foreground flex items-center gap-2">
                <Users className="w-7 h-7 text-primary" />
                Adhésions
              </h1>
              <p className="text-muted-foreground">
                {activeAdhesions.length} active{activeAdhesions.length > 1 ? "s" : ""} · {adhesions?.length ?? 0} au total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={importFromHelloAsso} disabled={importing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${importing ? "animate-spin" : ""}`} /> {importing ? "Import…" : "Import HelloAsso"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!adhesions?.length}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <AddAdhesionDialog />
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Déconnexion
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !adhesions?.length ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune adhésion pour le moment.</p>
          </div>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">Actives ({activeAdhesions.length})</TabsTrigger>
              {expiredYears.map((year) => (
                <TabsTrigger key={year} value={year}>{year} ({expiredByYear[year].length})</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="active">
              {activeAdhesions.length > 0 ? <AdhesionTable items={activeAdhesions} /> : <p className="text-muted-foreground text-center py-10">Aucune adhésion active.</p>}
            </TabsContent>
            {expiredYears.map((year) => (
              <TabsContent key={year} value={year}><AdhesionTable items={expiredByYear[year]} /></TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAdhesion} onOpenChange={() => setEditingAdhesion(null)}>
        <DialogContent className="max-w-md">
          {editingAdhesion && (
            <>
              <DialogHeader>
                <DialogTitle>Modifier l'adhésion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Prénom</label>
                    <Input value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nom</label>
                    <Input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                  <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Téléphone</label>
                  <Input value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Montant (€)</label>
                    <Input type="number" value={editForm.montant} onChange={(e) => setEditForm({ ...editForm, montant: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                    <Input value={editForm.type_adhesion} onChange={(e) => setEditForm({ ...editForm, type_adhesion: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Statut</label>
                  <select value={editForm.statut} onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
                    <option value="active">Active</option>
                    <option value="expirée">Expirée</option>
                    <option value="annulée">Annulée</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setEditingAdhesion(null)}>
                  <X className="w-4 h-4 mr-1" /> Annuler
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateAdhesion.isPending}>
                  {updateAdhesion.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAdhesions;
