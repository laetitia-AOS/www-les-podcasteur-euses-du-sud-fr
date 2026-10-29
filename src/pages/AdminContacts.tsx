import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fullName } from "@/lib/pds";
import { toCsv } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, Download, Trash2, Eye } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminOnglets, Panneau, useOnglet } from "@/components/admin/AdminOnglets";
import { useATraiter } from "@/components/admin/useATraiter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
import { useState } from "react";
import AdminMembreMessages from "@/components/AdminMembreMessages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusOptions = ["Nouveau", "En cours", "Traité", "Archivé"];

const AdminContacts = () => {
  const { isAdmin } = useAdminAuth();
  const { data: compteurs } = useATraiter(isAdmin);
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<any>(null);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const updateStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase.from("contacts").update({ statut }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-a-traiter"] });
      toast.success("Statut mis à jour");
    },
    onError: (err: any) => toast.error("Erreur : " + (err.message || "Erreur inconnue")),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Message supprimé");
      setSelectedContact(null);
    },
    onError: (err: any) => toast.error("Erreur : " + (err.message || "Erreur inconnue")),
  });

  const exportCSV = () => {
    if (!contacts?.length) return;
    const headers = ["Date", "Profil", "Prénom", "Nom", "Email", "Structure", "Objet", "Message", "Statut"];
    const rows = contacts.map((c) => [
      new Date(c.created_at).toLocaleDateString("fr-FR"),
      c.profil, c.prenom, c.nom, c.email, c.structure || "", c.objet, c.message, c.statut,
    ]);
    const csv = toCsv([headers, ...rows]);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const newCount = contacts?.filter(c => c.statut === "Nouveau").length ?? 0;

  const onglets = [
    { id: "site", label: "Formulaire de contact", compte: newCount },
    { id: "membres", label: "Messages aux membres", compte: compteurs?.messages_membres ?? 0 },
  ];
  const [onglet, setOnglet] = useOnglet(onglets);

  return (
    <AdminLayout titre="Messages" description="Ce qui arrive par le formulaire de contact du site, et les messages, collabs et devis envoyés aux membres.">
      <AdminOnglets label="Types de messages" onglets={onglets} courant={onglet} onChange={setOnglet} />
      {onglet === "membres" && <Panneau id="membres"><AdminMembreMessages /></Panneau>}
      {onglet === "site" && (
      <Panneau id="site">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <p className="text-sm text-muted-foreground mr-auto">
            {contacts?.length ?? 0} message{(contacts?.length ?? 0) > 1 ? "s" : ""}
            {newCount > 0 && <span className="text-primary font-medium"> · {newCount} nouveau{newCount > 1 ? "x" : ""}</span>}
          </p>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!contacts?.length}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !contacts?.length ? (
          <div className="text-center py-20">
            <Mail className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun message pour le moment.</p>
          </div>
        ) : (
          <div className="border border-border overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id} className={c.statut === "Nouveau" ? "bg-primary/5" : ""}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-sm">{c.profil}</TableCell>
                    <TableCell className="text-sm">
                      <p className="font-medium">{fullName(c.prenom, c.nom)}</p>
                      <a href={`mailto:${c.email}`} className="text-primary text-xs hover:underline">{c.email}</a>
                      {c.structure && <p className="text-xs text-muted-foreground">{c.structure}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{c.objet}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate" title={c.message}>{c.message}</TableCell>
                    <TableCell>
                      <select
                        value={c.statut}
                        onChange={(e) => updateStatut.mutate({ id: c.id, statut: e.target.value })}
                        className="text-xs rounded-md border border-border bg-card px-2 py-1 text-foreground"
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedContact(c)} title="Voir le message">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (window.confirm(`Supprimer le message de ${fullName(c.prenom, c.nom)} ?`)) {
                              deleteContact.mutate(c.id);
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
        )}
      </Panneau>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-lg">
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedContact.objet}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Contact</p>
                    <p className="font-medium">{fullName(selectedContact.prenom, selectedContact.nom)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline font-medium">{selectedContact.email}</a>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Profil</p>
                    <p className="font-medium">{selectedContact.profil}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Structure</p>
                    <p className="font-medium">{selectedContact.structure || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Date</p>
                    <p className="font-medium">{new Date(selectedContact.created_at).toLocaleString("fr-FR")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Statut</p>
                    <select
                      value={selectedContact.statut}
                      onChange={(e) => {
                        updateStatut.mutate({ id: selectedContact.id, statut: e.target.value });
                        setSelectedContact({ ...selectedContact, statut: e.target.value });
                      }}
                      className="text-sm rounded-md border border-border bg-card px-2 py-1 text-foreground"
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-2">Message</p>
                  <div className="bg-muted/30 border border-border rounded-lg p-4 whitespace-pre-wrap text-foreground">
                    {selectedContact.message}
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="destructive" size="sm"
                    onClick={() => {
                      if (window.confirm("Supprimer ce message ?")) deleteContact.mutate(selectedContact.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                  </Button>
                  <a href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.objet}`}>
                    <Button size="sm">
                      <Mail className="w-4 h-4 mr-1" /> Répondre
                    </Button>
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminContacts;
