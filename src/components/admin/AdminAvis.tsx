import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Eye, EyeOff, Flag, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatName, formatShortDate } from "@/lib/pds";
import { SITE_URL, ficheHref } from "@/lib/seo";
import { MOTIFS_SIGNALEMENT } from "@/lib/avis";

interface AvisAdmin {
  id: string;
  nom: string;
  email: string;
  note: number;
  commentaire: string;
  statut: "publie" | "masque";
  signale: boolean;
  motif_signalement: string | null;
  membre: boolean;
  created_at: string;
  podcasts: { nom_podcast: string; slug: string | null; type_profil: string } | null;
}

type Filtre = "tous" | "signales" | "masques";

const motifLabel = (code: string | null) => MOTIFS_SIGNALEMENT.find((m) => m.code === code)?.label || code || "";

/** Modération des avis : tout ce qui est écrit sous les fiches, signalé en premier, masqué ou supprimé ici. */
const AdminAvis = () => {
  const qc = useQueryClient();
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [q, setQ] = useState("");
  const [enCours, setEnCours] = useState<string | null>(null);

  const { data: avis = [], isLoading } = useQuery({
    queryKey: ["admin-avis"],
    queryFn: async (): Promise<AvisAdmin[]> => {
      const { data, error } = await supabase
        .from("avis")
        .select("id, nom, email, note, commentaire, statut, signale, motif_signalement, membre, created_at, podcasts(nom_podcast, slug, type_profil)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AvisAdmin[];
    },
  });

  const compte = (f: Filtre) =>
    f === "tous" ? avis.length : f === "signales" ? avis.filter((a) => a.signale).length : avis.filter((a) => a.statut === "masque").length;

  const liste = useMemo(() => {
    const s = q.trim().toLowerCase();
    return avis.filter(
      (a) =>
        (filtre === "tous" || (filtre === "signales" ? a.signale : a.statut === "masque")) &&
        (!s ||
          a.nom.toLowerCase().includes(s) ||
          a.email.includes(s) ||
          a.commentaire.toLowerCase().includes(s) ||
          (a.podcasts?.nom_podcast || "").toLowerCase().includes(s)),
    );
  }, [avis, filtre, q]);

  const maj = async (id: string, corps: Partial<AvisAdmin>, succes: string) => {
    setEnCours(id);
    const { error } = await supabase.from("avis").update(corps).eq("id", id);
    setEnCours(null);
    if (error) { toast.error("La modification n'a pas été enregistrée."); return; }
    toast.success(succes);
    qc.invalidateQueries({ queryKey: ["admin-avis"] });
  };

  const supprimer = async (a: AvisAdmin) => {
    if (!window.confirm("Supprimer définitivement cet avis ? Cette action est irréversible.")) return;
    setEnCours(a.id);
    const { error } = await supabase.from("avis").delete().eq("id", a.id);
    setEnCours(null);
    if (error) { toast.error("La suppression n'a pas abouti."); return; }
    toast.success("Avis supprimé.");
    qc.invalidateQueries({ queryKey: ["admin-avis"] });
  };

  return (
    <section aria-labelledby="avis-admin-title" className="mb-10">
      <h2 id="avis-admin-title" className="font-display font-bold text-xl">Avis sur les podcasts</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
        Les avis sont publiés dès qu'ils sont écrits. Masquez un avis pour le retirer du site sans le perdre,
        supprimez-le définitivement, ou classez un signalement sans suite.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail, podcast ou commentaire" className="max-w-xs" aria-label="Rechercher un avis" />
        {(["tous", "signales", "masques"] as Filtre[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltre(f)}
            aria-pressed={filtre === f}
            className={`min-h-[38px] border px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              filtre === f ? "border-foreground bg-foreground text-background" : "border-input bg-background hover:bg-muted"
            }`}
          >
            {f === "tous" ? "Tous" : f === "signales" ? "Signalés" : "Masqués"} ({compte(f)})
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : !liste.length ? (
        <div className="text-center py-16 border-2 border-dashed border-border">
          <p className="text-muted-foreground">
            {filtre === "signales" ? "Aucun avis signalé." : filtre === "masques" ? "Aucun avis masqué." : "Aucun avis pour l'instant."}
          </p>
        </div>
      ) : (
        <div className="border border-border overflow-x-auto bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">Date</TableHead>
                <TableHead>Podcast</TableHead>
                <TableHead className="hidden md:table-cell">Auteur·ice</TableHead>
                <TableHead className="w-[70px]">Note</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead className="w-[150px]">État</TableHead>
                <TableHead className="w-[190px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liste.map((a) => {
                const masque = a.statut === "masque";
                const href = a.podcasts ? `${SITE_URL}${ficheHref({ id: a.podcasts.slug || a.id, slug: a.podcasts.slug, type_profil: a.podcasts.type_profil, nom_podcast: a.podcasts.nom_podcast })}` : null;
                return (
                  <TableRow key={a.id} className={masque ? "opacity-60" : ""}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{formatShortDate(a.created_at)}</TableCell>
                    <TableCell className="max-w-[220px]">
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:text-primary">
                          {a.podcasts?.nom_podcast}<ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">fiche supprimée</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm whitespace-nowrap">
                      <span className="font-semibold">{formatName(a.nom)}</span>
                      <span className="block text-muted-foreground">{a.email}</span>
                      {a.membre && <Badge variant="outline" className="mt-1 text-xs">Membre</Badge>}
                    </TableCell>
                    <TableCell className="font-mono">{a.note}/5</TableCell>
                    <TableCell className="max-w-[420px] text-sm">
                      <span className="block whitespace-pre-line">{a.commentaire}</span>
                      {a.signale && (
                        <Badge variant="destructive" className="mt-1 text-xs">
                          <Flag className="w-3 h-3 mr-1" aria-hidden /> {motifLabel(a.motif_signalement)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{masque ? <Badge variant="secondary" className="text-xs">Masqué</Badge> : <Badge variant="outline" className="text-xs">En ligne</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="outline" size="sm" disabled={enCours === a.id}
                          onClick={() => maj(a.id, { statut: masque ? "publie" : "masque" }, masque ? "Avis remis en ligne." : "Avis masqué.")}
                        >
                          {masque ? <Eye className="w-4 h-4 mr-1" aria-hidden /> : <EyeOff className="w-4 h-4 mr-1" aria-hidden />}
                          {masque ? "Remettre" : "Masquer"}
                        </Button>
                        {a.signale && (
                          <Button variant="outline" size="sm" disabled={enCours === a.id} onClick={() => maj(a.id, { signale: false, motif_signalement: null }, "Signalement classé sans suite.")}>
                            Sans suite
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" disabled={enCours === a.id} onClick={() => supprimer(a)} aria-label={`Supprimer l'avis de ${formatName(a.nom)}`}>
                          <Trash2 className="w-4 h-4" aria-hidden />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};

export default AdminAvis;
