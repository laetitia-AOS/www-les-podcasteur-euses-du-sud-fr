import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowLeft, LogOut, Loader2, Download, Trash2, Eye } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusOptions = ["Nouveau", "En cours", "Traité", "Archivé"];

const AdminContacts = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAdminAuth();
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
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const newCount = contacts?.filter(c => c.statut === "Nouveau").length ?? 0;

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
                <Mail className="w-7 h-7 text-primary" />
                Messages de contact
              </h1>
              <p className="text-muted-foreground">
                {contacts?.length ?? 0} message{(contacts?.length ?? 0) > 1 ? "s" : ""}
                {newCount > 0 && <span className="text-primary font-medium"> · {newCount} nouveau{newCount > 1 ? "x" : ""}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!contacts?.length}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Déconnexion
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !contacts?.length ? (
          <div className="text-center py-20">
            <Mail className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun message pour le moment.</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
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
                      <p className="font-medium">{c.prenom} {c.nom}</p>
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
                            if (window.confirm(`Supprimer le message de ${c.prenom} ${c.nom} ?`)) {
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
      </div>

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
                    <p className="font-medium">{selectedContact.prenom} {selectedContact.nom}</p>
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
    </div>
  );
};

export default AdminContacts;
