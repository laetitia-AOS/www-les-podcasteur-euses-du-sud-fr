import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ExternalLink, Rss, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type FluxAdmin = {
  podcast_id: string; nom_podcast: string; porteur: string | null; lien_ecoute: string | null; source: string | null;
  statut: string; message: string | null; flux_url: string | null; flux_titre: string | null; flux_auteur: string | null;
  confirmation: string; nb_episodes: number; derniere_lecture: string; confirme_le: string | null;
};

const CONF: Record<string, string> = { a_confirmer: "À confirmer", confirme: "Confirmé", refuse: "Écarté" };

/**
 * Flux trouvés automatiquement : leurs épisodes ne s'affichent qu'après confirmation par un·e admin
 * (règle appliquée par le serveur). Un flux saisi par le membre est confirmé d'office.
 */
const AdminFlux = () => {
  const qc = useQueryClient();
  const [tout, setTout] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { data: flux = [], isLoading } = useQuery({
    queryKey: ["admin-flux"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_flux");
      if (error) throw error;
      return (data || []) as FluxAdmin[];
    },
  });

  const devines = flux.filter((f) => f.source && f.source !== "flux saisi" && f.flux_url);
  const aConfirmer = devines.filter((f) => f.confirmation === "a_confirmer");
  const liste = tout ? devines : aConfirmer;

  const decider = async (id: string, decision: "confirme" | "refuse" | "a_confirmer") => {
    setBusy(id);
    const { error } = await supabase.rpc("confirmer_flux", { _podcast_id: id, _decision: decision });
    setBusy(null);
    if (error) { toast.error("La décision n'a pas pu être enregistrée."); return; }
    toast.success(decision === "confirme" ? "Flux confirmé : ses épisodes s'affichent sur le site." : decision === "refuse" ? "Flux écarté." : "Flux remis à confirmer.");
    qc.invalidateQueries({ queryKey: ["admin-flux"] });
  };

  if (isLoading || devines.length === 0) return null;

  return (
    <section aria-labelledby="flux-title" className="mb-8 border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 id="flux-title" className="font-display font-bold text-xl flex items-center gap-2">
          <Rss className="w-5 h-5 text-primary" aria-hidden /> Flux trouvés automatiquement
          {aConfirmer.length > 0 && <Badge variant="destructive">{aConfirmer.length} à confirmer</Badge>}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setTout((v) => !v)} aria-pressed={tout}>
          {tout ? "Voir seulement ceux à confirmer" : `Voir tous (${devines.length})`}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4 max-w-prose">
        Vérifiez que le flux correspond bien au podcast de la fiche. Ses épisodes n'apparaissent sur le site qu'une fois confirmé. Un flux saisi par le membre n'a pas besoin de confirmation.
      </p>
      {liste.length === 0 ? <p className="text-sm text-muted-foreground">Aucun flux à confirmer.</p> : (
        <ul className="divide-y divide-border">
          {liste.map((f) => (
            <li key={f.podcast_id} className="py-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
              <div>
                <p className="text-xs text-muted-foreground">Sur la fiche</p>
                <p className="font-medium">{f.nom_podcast}</p>
                {f.porteur && <p className="text-sm text-muted-foreground">{f.porteur}</p>}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Dans le flux ({f.source})</p>
                <p className="font-medium">{f.flux_titre || "Nom non indiqué"}</p>
                <p className="text-sm text-muted-foreground">{f.flux_auteur || "Auteur non indiqué"}</p>
                <a href={f.flux_url!} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline break-all inline-flex items-center gap-1">
                  {f.flux_url} <ExternalLink className="w-3 h-3 shrink-0" aria-hidden /><span className="sr-only">(nouvel onglet)</span>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {f.confirmation !== "a_confirmer" && <Badge variant="secondary">{CONF[f.confirmation]}</Badge>}
                {f.confirmation !== "confirme" && (
                  <Button size="sm" onClick={() => decider(f.podcast_id, "confirme")} disabled={busy === f.podcast_id}>
                    <Check className="w-4 h-4 mr-1" aria-hidden /> Confirmer
                  </Button>
                )}
                {f.confirmation !== "refuse" && (
                  <Button size="sm" variant="outline" onClick={() => decider(f.podcast_id, "refuse")} disabled={busy === f.podcast_id}>
                    <X className="w-4 h-4 mr-1" aria-hidden /> Écarter
                  </Button>
                )}
                {f.confirmation !== "a_confirmer" && (
                  <Button size="sm" variant="ghost" onClick={() => decider(f.podcast_id, "a_confirmer")} disabled={busy === f.podcast_id}>Annuler</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AdminFlux;
