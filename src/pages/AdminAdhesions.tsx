import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lock, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ADMIN_PASSWORD = "pds-admin-2025";

const AdminAdhesions = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { data: adhesions, isLoading } = useQuery({
    queryKey: ["adhesions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adhesions" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: isAuthenticated,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Mot de passe incorrect");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-serif text-2xl text-foreground">Espace admin</h1>
            <p className="text-muted-foreground mt-1">Suivi des adhésions</p>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Accéder</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-3xl text-foreground flex items-center gap-2">
                <Users className="w-7 h-7 text-primary" />
                Adhésions
              </h1>
              <p className="text-muted-foreground">
                {adhesions?.length ?? 0} adhésion{(adhesions?.length ?? 0) > 1 ? "s" : ""} enregistrée{(adhesions?.length ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !adhesions?.length ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune adhésion pour le moment.</p>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Les adhésions apparaîtront ici dès qu'un webhook HelloAsso sera configuré.
            </p>
          </div>
        ) : (
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {adhesions.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">
                      {a.date_adhesion
                        ? new Date(a.date_adhesion).toLocaleDateString("fr-FR")
                        : new Date(a.created_at).toLocaleDateString("fr-FR")}
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
                      <Badge variant={a.statut === "active" ? "default" : "secondary"}>
                        {a.statut}
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

export default AdminAdhesions;
