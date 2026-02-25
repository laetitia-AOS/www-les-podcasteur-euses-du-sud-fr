import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowLeft, LogOut, Loader2, Download } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const AdminContacts = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAdminAuth();

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

  const exportCSV = () => {
    if (!contacts?.length) return;
    const headers = ["Date", "Profil", "Prénom", "Nom", "Email", "Structure", "Objet", "Message", "Statut"];
    const rows = contacts.map((c) => [
      new Date(c.created_at).toLocaleDateString("fr-FR"),
      c.profil,
      c.prenom,
      c.nom,
      c.email,
      c.structure || "",
      c.objet,
      c.message,
      c.statut,
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
                {contacts?.length ?? 0} message{(contacts?.length ?? 0) > 1 ? "s" : ""} reçu{(contacts?.length ?? 0) > 1 ? "s" : ""}
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
                  <TableHead>Prénom</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Structure</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-sm">{c.profil}</TableCell>
                    <TableCell>{c.prenom}</TableCell>
                    <TableCell>{c.nom}</TableCell>
                    <TableCell className="text-sm">
                      <a href={`mailto:${c.email}`} className="text-primary hover:underline">
                        {c.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm">{c.structure || "—"}</TableCell>
                    <TableCell className="text-sm">{c.objet}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate" title={c.message}>
                      {c.message}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.statut === "Nouveau" ? "default" : "secondary"}>
                        {c.statut}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContacts;
