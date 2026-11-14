// Admin de L'Onde du Sud : les abonné·es (réservé aux admins, règle appliquée par la base).
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { btnSecondary, formatName } from "@/lib/pds";
import { toCsv } from "@/lib/csv";
import { LIBELLE_SOURCE_ABONNE, LIBELLE_STATUT_ABONNE, NOM_ONDE, type SourceAbonne, type StatutAbonne } from "@/lib/onde";
import { btnIcone, dateHeure, messageOnde } from "@/components/onde/adminOnde";

type Abonne = {
  id: string; email: string; prenom: string | null; source: SourceAbonne; statut: StatutAbonne;
  consentement_le: string | null; consentement_texte: string | null; confirme_le: string | null;
  desinscrit_le: string | null; created_at: string; adherent: boolean;
};
type Bilan = { adherents_office: number; destinataires: number; actifs: number; en_attente: number; desinscrits: number };

const FILTRES: { id: "tous" | StatutAbonne; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "actif", label: "Actifs" },
  { id: "en_attente", label: "En attente" },
  { id: "desinscrit", label: "Désinscrits" },
];

const Badge = ({ children, plein = false }: { children: React.ReactNode; plein?: boolean }) => (
  <span className={`font-mono text-[11px] uppercase tracking-wider px-1.5 py-0.5 ${plein ? "bg-primary text-primary-foreground" : "border border-encre"}`}>{children}</span>
);

const sansAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const AbonnesOnde = () => {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<(typeof FILTRES)[number]["id"]>("tous");
  const [aSupprimer, setASupprimer] = useState<Abonne | null>(null);

  const { data: bilan } = useQuery({
    queryKey: ["onde-abonnes-bilan"],
    queryFn: async (): Promise<Bilan> => {
      const { data, error } = await supabase.rpc("onde_abonnes_bilan");
      if (error) throw error;
      return data as unknown as Bilan;
    },
  });
  const { data: liste = [], isLoading, isError } = useQuery({
    queryKey: ["onde-abonnes"],
    queryFn: async (): Promise<Abonne[]> => {
      const { data, error } = await supabase.rpc("onde_abonnes_liste");
      if (error) throw error;
      return (data || []) as Abonne[];
    },
  });

  const visibles = useMemo(() => {
    const t = sansAccents(q.trim());
    return liste.filter((a) => (filtre === "tous" || a.statut === filtre) && (!t || sansAccents(`${a.prenom || ""} ${a.email}`).includes(t)));
  }, [liste, q, filtre]);

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("onde_supprimer_abonne", { _id: id });
      if (error) throw error;
      if (!data) throw { message: "Abonné·e introuvable." };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onde-abonnes"] });
      qc.invalidateQueries({ queryKey: ["onde-abonnes-bilan"] });
      setASupprimer(null);
      toast.success("Abonné·e supprimé·e");
    },
    onError: (e: { code?: string; message?: string }) => toast.error(messageOnde(e, "Suppression impossible.")),
  });

  const exporter = () => {
    const entetes = ["Prénom", "E-mail", "Statut", "Source", "Adhérent·e à jour", "Inscrit·e le", "Consentement le", "Texte du consentement", "Confirmé le", "Désinscrit·e le"];
    const lignes = visibles.map((a) => [
      a.prenom || "", a.email, LIBELLE_STATUT_ABONNE[a.statut], LIBELLE_SOURCE_ABONNE[a.source], a.adherent ? "oui" : "non",
      dateHeure(a.created_at), dateHeure(a.consentement_le), a.consentement_texte || "", dateHeure(a.confirme_le), dateHeure(a.desinscrit_le),
    ]);
    const blob = new Blob(["\uFEFF" + toCsv([entetes, ...lignes])], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `onde-du-sud-abonnes_${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  };

  const chiffres: [number | undefined, string][] = [
    [bilan?.adherents_office, "adhérent·es inclus·es d'office"],
    [bilan?.actifs, "abonné·es actif·ves"],
    [bilan?.en_attente, "en attente de confirmation"],
    [bilan?.desinscrits, "désinscrit·es"],
  ];

  return (
    <div>
      <p className="text-[15px] max-w-[70ch]">
        Les adhérent·es à jour reçoivent {NOM_ONDE} d'office, sauf s'ils ou elles se sont désinscrit·es.
        Les autres la reçoivent seulement après avoir confirmé leur inscription par le lien envoyé par e-mail.
      </p>

      <dl className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {chiffres.map(([n, label]) => (
          <div key={label} className="border-2 border-encre bg-background p-4 flex flex-col-reverse">
            <dt className="text-sm">{label}</dt>
            <dd className="font-mono text-3xl font-bold">{n ?? "…"}</dd>
          </div>
        ))}
      </dl>
      {bilan && (
        <p className="mt-3 text-sm text-muted-foreground">
          Un numéro envoyé aujourd'hui partirait à {bilan.destinataires} adresse{bilan.destinataires > 1 ? "s" : ""} (une seule fois par personne).
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5 flex-1 min-w-[240px]">
          <Label htmlFor="onde-abonnes-recherche">Rechercher</Label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="onde-abonnes-recherche" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Prénom ou e-mail" className="pl-9" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
          {FILTRES.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filtre === f.id}
              onClick={() => setFiltre(f.id)}
              className={`h-10 px-3 border-2 border-encre text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${filtre === f.id ? "bg-encre text-surface" : "bg-background hover:bg-muted"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" className={btnSecondary} onClick={exporter} disabled={!visibles.length}>
          <Download className="w-4 h-4" aria-hidden /> Exporter (CSV)
        </button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
        ) : isError ? (
          <p className="text-destructive font-bold">La liste n'a pas pu être chargée. Rechargez la page.</p>
        ) : liste.length === 0 ? (
          <p className="text-muted-foreground">Personne ne s'est encore inscrit·e par le formulaire. Les adhérent·es à jour sont déjà compté·es plus haut.</p>
        ) : visibles.length === 0 ? (
          <p className="text-muted-foreground">Aucun résultat pour cette recherche.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-2" aria-live="polite">{visibles.length} sur {liste.length}</p>
            <ul className="border-t-2 border-encre divide-y divide-filet">
              {visibles.map((a) => (
                <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-bold">{a.prenom ? formatName(a.prenom) : <span className="text-muted-foreground font-normal">Sans prénom</span>}</p>
                    <p className="text-sm break-all">{a.email}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge plein={a.statut === "actif"}>{LIBELLE_STATUT_ABONNE[a.statut]}</Badge>
                      {a.adherent && <Badge>Adhérent·e</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {LIBELLE_SOURCE_ABONNE[a.source]} · inscrit·e le {dateHeure(a.created_at)}
                      {a.confirme_le ? ` · confirmé le ${dateHeure(a.confirme_le)}` : ""}
                      {a.desinscrit_le ? ` · désinscrit·e le ${dateHeure(a.desinscrit_le)}` : ""}
                    </p>
                  </div>
                  <button type="button" className={btnIcone} onClick={() => setASupprimer(a)} aria-label={`Supprimer ${a.email} de la liste`}>
                    <Trash2 className="w-4 h-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {aSupprimer?.email} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes ses informations d'abonnement sont effacées, sans retour possible (droit à l'effacement).
              {aSupprimer?.adherent
                ? " Comme elle ou il est adhérent·e à jour, elle ou il recevra de nouveau L'Onde d'office. Pour l'arrêter, laissez-la ou laissez-le plutôt désinscrit·e."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => aSupprimer && supprimer.mutate(aSupprimer.id)}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AbonnesOnde;
