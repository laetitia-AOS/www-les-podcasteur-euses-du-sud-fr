import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { joursRestants } from "@/lib/espaceMembre";

export type MembreAdmin = {
  email: string; nom: string; type_profil: string | null; formule: string; etat: string;
  date_echeance: string | null; montant: number | null; date_paiement: string | null; adhesion_id: string | null;
  nb_fiches: number; fiche_validee: boolean; fiche_visible: boolean; rappel_30: string | null; rappel_7: string | null;
};

const ETAT: Record<string, string> = {
  a_jour: "À jour", bientot: "Se termine bientôt", verification: "À vérifier sur HelloAsso",
  terminee: "Terminée", sans_adhesion: "Sans adhésion",
};
const TYPE: Record<string, string> = {
  podcasteur: "Podcasteur·euse", pro_podcast: "Acteur·ice", studio: "Studio / agence", structure_eco: "Structure", soutien: "Soutien",
};
const date = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

/** Liste des membres (réservée aux admins : le serveur ne renvoie rien aux autres comptes). */
const AdminMembres = () => {
  const [q, setQ] = useState("");
  const [etat, setEtat] = useState("tous");
  const [formule, setFormule] = useState("toutes");

  const { data: membres = [], isLoading } = useQuery({
    queryKey: ["admin-membres"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_membres");
      if (error) throw error;
      return (data || []) as MembreAdmin[];
    },
  });

  const liste = useMemo(() => {
    const s = q.trim().toLowerCase();
    return membres.filter((m) =>
      (etat === "tous" || (etat === "masquees" ? m.fiche_validee && !m.fiche_visible : m.etat === etat)) &&
      (formule === "toutes" || m.formule === formule) &&
      (!s || m.nom.toLowerCase().includes(s) || m.email.includes(s)));
  }, [membres, q, etat, formule]);

  const proches = useMemo(() => membres
    .filter((m) => m.etat === "bientot")
    .sort((a, b) => (a.date_echeance || "").localeCompare(b.date_echeance || "")), [membres]);

  const masquees = membres.filter((m) => m.fiche_validee && !m.fiche_visible).length;

  const exporter = () => {
    const rows = liste.map((m) => [
      m.nom, m.email, m.formule === "studio" ? "Studio / agence" : "Personne", TYPE[m.type_profil || ""] || "",
      ETAT[m.etat] || m.etat, date(m.date_echeance), m.montant ?? "", date(m.date_paiement), m.fiche_visible ? "Oui" : "Non",
    ]);
    const csv = toCsv([["Nom", "E-mail", "Formule", "Profil", "Statut", "Échéance", "Montant payé (€)", "Dernier paiement", "Fiche visible"], ...rows]);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `membres-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (isLoading) return <p className="text-muted-foreground">Chargement des membres…</p>;

  return (
    <section aria-labelledby="membres-title" className="mb-12">
      <h2 id="membres-title" className="font-display font-bold text-2xl mb-1">Membres</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {membres.filter((m) => m.etat === "a_jour" || m.etat === "bientot").length} à jour · {proches.length} échéance{proches.length > 1 ? "s" : ""} dans les 30 jours ·{" "}
        <button type="button" className="underline underline-offset-4" onClick={() => setEtat("masquees")}>{masquees} fiche{masquees > 1 ? "s" : ""} masquée{masquees > 1 ? "s" : ""} faute d'adhésion à jour</button>
      </p>
      <Tabs defaultValue="membres" className="space-y-4">
        <TabsList>
          <TabsTrigger value="membres">Membres ({membres.length})</TabsTrigger>
          <TabsTrigger value="echeances">Échéances proches ({proches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="membres" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou e-mail" className="max-w-xs" aria-label="Rechercher un membre" />
            <select value={etat} onChange={(e) => setEtat(e.target.value)} className="h-10 border border-input bg-background px-3 text-sm" aria-label="Filtrer par statut">
              <option value="tous">Tous les statuts</option>
              {Object.entries(ETAT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              <option value="masquees">Fiches masquées</option>
            </select>
            <select value={formule} onChange={(e) => setFormule(e.target.value)} className="h-10 border border-input bg-background px-3 text-sm" aria-label="Filtrer par formule">
              <option value="toutes">Toutes les formules</option>
              <option value="personne">Personne</option>
              <option value="studio">Studio / agence</option>
            </select>
            <Button variant="outline" size="sm" onClick={exporter} disabled={!liste.length}><Download className="w-4 h-4 mr-2" /> Export CSV ({liste.length})</Button>
          </div>
          <div className="border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead><TableHead>Type</TableHead><TableHead>Statut</TableHead>
                  <TableHead>Échéance</TableHead><TableHead>Montant payé</TableHead><TableHead>Fiche</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liste.map((m) => (
                  <TableRow key={m.email}>
                    <TableCell><p className="font-medium">{m.nom}</p><p className="text-xs text-muted-foreground break-all">{m.email}</p></TableCell>
                    <TableCell className="text-sm">{m.formule === "studio" ? "Studio / agence" : "Personne"}{m.type_profil && <span className="block text-xs text-muted-foreground">{TYPE[m.type_profil] || m.type_profil}</span>}</TableCell>
                    <TableCell><Badge variant={m.etat === "a_jour" ? "default" : m.etat === "verification" ? "destructive" : "secondary"}>{ETAT[m.etat] || m.etat}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{date(m.date_echeance)}</TableCell>
                    <TableCell className="font-mono text-sm">{m.montant != null ? `${Number(m.montant)} €` : "—"}<span className="block text-xs text-muted-foreground">{m.date_paiement ? `le ${date(m.date_paiement)}` : ""}</span></TableCell>
                    <TableCell className="text-sm">{m.nb_fiches === 0 ? "Aucune" : m.fiche_visible ? "Visible" : m.fiche_validee ? "Masquée" : "En attente"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="echeances" className="space-y-3">
          <p className="text-sm text-muted-foreground max-w-prose">
            Le bouton « Envoyer le rappel » enverra un e-mail à ce membre seulement, avec le lien de renouvellement. Il sera actif quand le domaine d'envoi d'e-mails sera relié au site.
          </p>
          {proches.length === 0 ? <p className="text-muted-foreground py-6">Aucune échéance dans les 30 prochains jours.</p> : (
            <div className="border border-border overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Membre</TableHead><TableHead>Échéance</TableHead><TableHead>Rappel 30 j</TableHead><TableHead>Rappel 7 j</TableHead></TableRow></TableHeader>
                <TableBody>
                  {proches.map((m) => {
                    const j = joursRestants(m.date_echeance) ?? 0;
                    return (
                      <TableRow key={m.email}>
                        <TableCell><p className="font-medium">{m.nom}</p><p className="text-xs text-muted-foreground break-all">{m.email}</p></TableCell>
                        <TableCell className="font-mono text-sm">{date(m.date_echeance)} <span className="text-muted-foreground">(J-{j})</span></TableCell>
                        {[30, 7].map((palier) => {
                          const envoye = palier === 30 ? m.rappel_30 : m.rappel_7;
                          return (
                            <TableCell key={palier}>
                              {envoye ? <span className="text-sm">Envoyé le {date(envoye)}</span> : j <= palier ? (
                                <Button size="sm" variant="outline" disabled title="Disponible quand le domaine d'envoi sera relié">
                                  <Mail className="w-4 h-4 mr-1" /> Envoyer le rappel
                                </Button>
                              ) : <span className="text-xs text-muted-foreground">à partir de J-{palier}</span>}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default AdminMembres;
