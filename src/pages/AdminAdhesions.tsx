import { useState, useMemo } from "react";
import { formatName, fullName } from "@/lib/pds";
import { toCsv } from "@/lib/csv";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Loader2, Download, RefreshCw, Trash2, Pencil, Save, X, Link2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminOnglets, Panneau, useOnglet } from "@/components/admin/AdminOnglets";
import RelanceCollective from "@/components/admin/RelanceCollective";
import { membresDeLaVue, type MembreAdmin } from "@/components/admin/AdminMembres";
import { anneeEnCours } from "@/lib/espaceMembre";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AddAdhesionDialog from "@/components/AddAdhesionDialog";
import AdminMembres from "@/components/admin/AdminMembres";
import RattacherAdhesionDialog, { useRattachements } from "@/components/RattacherAdhesionDialog";
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
  const { isAdmin } = useAdminAuth();
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();
  const [editingAdhesion, setEditingAdhesion] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [linking, setLinking] = useState<any>(null);

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

  const { data: rattachements = [] } = useRattachements(isAdmin);

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
    mutationFn: async ({ id, data, avant }: { id: string; data: any; avant?: string }) => {
      const { error } = await supabase.from("adhesions").update(data).eq("id", id);
      if (error) throw error;
      // Paiement validé à la main : le membre reçoit son e-mail de bienvenue (une seule fois)
      if (data.statut === "active" && avant !== "active") {
        const { data: r } = await supabase.functions.invoke("notifier-membre", { body: { type: "adhesion", id } });
        return { emailed: !!r?.sent };
      }
      return { emailed: false };
    },
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["adhesions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-membres"] });
      toast.success(r?.emailed ? "Adhésion validée : le membre a reçu son e-mail de bienvenue" : "Adhésion modifiée");
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
      avant: editingAdhesion.statut,
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
    const csv = toCsv([headers, ...rows]);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `adhesions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const aVerifier = (adhesions || []).filter((a: any) => a.statut === "a_verifier").length;
  const { data: tousMembres = [] } = useQuery({
    queryKey: ["admin-membres"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_membres");
      if (error) throw error;
      return ((data || []) as MembreAdmin[]).map((m) => ({ ...m, nom: m.nom && !m.nom.includes("@") ? formatName(m.nom) : m.nom }));
    },
    enabled: isAdmin,
  });
  const yy = anneeEnCours();
  const onglets = [
    { id: "membres", label: `Membres ${yy} (${membresDeLaVue(tousMembres, "annee", new Set(rattachements.map((r) => r.adhesion_id))).length})` },
    { id: "anciens", label: `Anciens membres (${membresDeLaVue(tousMembres, "anciens").length})` },
    { id: "sans-adhesion", label: `Fiches sans adhésion (${membresDeLaVue(tousMembres, "sans").length})` },
    { id: "paiements", label: "Paiements HelloAsso", compte: aVerifier },
    { id: "relances", label: "Relances" },
  ];
  const [onglet, setOnglet] = useOnglet(onglets);

  const actionsAdhesion = (a: any) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setLinking(a)} title="Rattacher à un compte membre" aria-label="Rattacher à un compte membre">
          <Link2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => startEdit(a)} title="Modifier" aria-label="Modifier ce paiement">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (window.confirm(`Supprimer l'adhésion de ${fullName(a.prenom, a.nom)} ?`)) {
              deleteAdhesion.mutate(a.id);
            }
          }}
          title="Supprimer"
          aria-label="Supprimer ce paiement"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
  );

  const statutBadge = (a: any) => (
    <Badge variant={a.statut === "active" ? "default" : a.statut === "a_verifier" ? "destructive" : "secondary"}>
      {a.statut === "a_verifier" ? "À vérifier sur HelloAsso" : a.statut}
    </Badge>
  );

  const AdhesionTable = ({ items }: { items: any[] }) => (
    <>
    {/* Téléphone : une carte par paiement */}
    <ul className="md:hidden space-y-3">
      {items.map((a: any) => {
        const liens = rattachements.filter((r) => r.adhesion_id === a.id);
        return (
          <li key={a.id} className="border-2 border-foreground bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-sm text-muted-foreground">{getAdhesionDate(a).toLocaleDateString("fr-FR")}</p>
                <p className="font-bold text-[17px] leading-tight break-words">{fullName(a.prenom, a.nom) || a.email || "—"}</p>
              </div>
              <p className="font-bold text-[17px] whitespace-nowrap">{a.montant ? `${a.montant} €` : "—"}</p>
            </div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[15px]">
              <dt className="text-muted-foreground">Formule</dt>
              <dd className="min-w-0 break-words">{a.formule === "studio" ? "Studio ou agence" : a.formule === "personne" ? "Personne" : a.type_adhesion || "—"}</dd>
              <dt className="text-muted-foreground">Statut</dt>
              <dd>{statutBadge(a)}</dd>
              <dt className="text-muted-foreground">Rattachement</dt>
              <dd className="min-w-0 break-words">{liens.length ? liens.map((r) => <span key={r.id} className="block">{r.email_membre}</span>) : "Aucun"}</dd>
              {a.email && <><dt className="text-muted-foreground">E-mail</dt><dd className="min-w-0 break-all">{a.email}</dd></>}
            </dl>
            <div className="mt-3 pt-2 border-t border-border">{actionsAdhesion(a)}</div>
          </li>
        );
      })}
    </ul>
    <div className="hidden md:block border border-border overflow-x-auto bg-card">
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
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a: any) => (
            <TableRow key={a.id}>
              <TableCell className="text-sm whitespace-nowrap">
                {getAdhesionDate(a).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell>{formatName(a.prenom) || "—"}</TableCell>
              <TableCell>{formatName(a.nom) || "—"}</TableCell>
              <TableCell className="text-sm">
                {a.email || "—"}
                {rattachements.filter((r) => r.adhesion_id === a.id).map((r) => (
                  <span key={r.id} className="block text-xs text-muted-foreground">Rattaché à {r.email_membre}</span>
                ))}
              </TableCell>
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
                {statutBadge(a)}
              </TableCell>
              <TableCell>
                {actionsAdhesion(a)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </>
  );

  return (
    <AdminLayout
      titre="Membres"
      description={`${activeAdhesions.length} adhésion${activeAdhesions.length > 1 ? "s" : ""} active${activeAdhesions.length > 1 ? "s" : ""} · ${adhesions?.length ?? 0} paiements enregistrés`}
    >
      <AdminOnglets label="Rubriques membres" onglets={onglets} courant={onglet} onChange={setOnglet} />

      {onglet === "membres" && <Panneau id="membres"><AdminMembres vue="annee" /></Panneau>}
      {onglet === "anciens" && <Panneau id="anciens"><AdminMembres vue="anciens" /></Panneau>}
      {onglet === "sans-adhesion" && <Panneau id="sans-adhesion"><AdminMembres vue="sans" /></Panneau>}

      {onglet === "relances" && <Panneau id="relances"><RelancesOnglet /></Panneau>}

      {onglet === "paiements" && (
        <Panneau id="paiements">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={importFromHelloAsso} disabled={importing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${importing ? "animate-spin motion-reduce:animate-none" : ""}`} /> {importing ? "Import…" : "Import HelloAsso"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!adhesions?.length}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <AddAdhesionDialog />
          </div>
          {isLoading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : !adhesions?.length ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune adhésion pour le moment.</p>
            </div>
          ) : (
            <Tabs defaultValue={aVerifier ? "a_verifier" : "active"} className="space-y-4">
              <TabsList className="flex-wrap h-auto">
                {aVerifier > 0 && <TabsTrigger value="a_verifier">À vérifier ({aVerifier})</TabsTrigger>}
                <TabsTrigger value="active">Actives ({activeAdhesions.length})</TabsTrigger>
                {expiredYears.map((year) => (
                  <TabsTrigger key={year} value={year}>{year} ({expiredByYear[year].length})</TabsTrigger>
                ))}
              </TabsList>
              {aVerifier > 0 && (
                <TabsContent value="a_verifier"><AdhesionTable items={adhesions.filter((a: any) => a.statut === "a_verifier")} /></TabsContent>
              )}
              <TabsContent value="active">
                {activeAdhesions.length > 0 ? <AdhesionTable items={activeAdhesions} /> : <p className="text-muted-foreground text-center py-10">Aucune adhésion active.</p>}
              </TabsContent>
              {expiredYears.map((year) => (
                <TabsContent key={year} value={year}><AdhesionTable items={expiredByYear[year]} /></TabsContent>
              ))}
            </Tabs>
          )}
        </Panneau>
      )}

      <RattacherAdhesionDialog adhesion={linking} rattachements={rattachements} onClose={() => setLinking(null)} />

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
                    <option value="a_verifier">À vérifier sur HelloAsso</option>
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
    </AdminLayout>
  );
};

/** Relance collective de renouvellement, dans son propre onglet. */
const RelancesOnglet = () => {
  const { data: membres = [], isLoading } = useQuery({
    queryKey: ["admin-membres"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_membres");
      if (error) throw error;
      return ((data || []) as MembreAdmin[]).map((m) => ({ ...m, nom: m.nom && !m.nom.includes("@") ? formatName(m.nom) : m.nom }));
    },
  });
  if (isLoading) return <p className="text-muted-foreground">Chargement…</p>;
  return <RelanceCollective membres={membres} />;
};

export default AdminAdhesions;
