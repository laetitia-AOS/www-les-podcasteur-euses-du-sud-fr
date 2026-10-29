import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

export type Onglet = { id: string; label: string; compte?: number };

/** Onglet courant, lu dans l'adresse (?onglet=…) pour que les liens et le bouton retour fonctionnent. */
export const useOnglet = (onglets: Onglet[]) => {
  const [params, setParams] = useSearchParams();
  const demande = params.get("onglet");
  const courant = onglets.some((o) => o.id === demande) ? (demande as string) : onglets[0].id;
  const changer = (id: string) => {
    const p = new URLSearchParams(params);
    p.set("onglet", id);
    setParams(p);
  };
  return [courant, changer] as const;
};

/** Barre d'onglets carrée, aux couleurs du site, navigable au clavier (flèches gauche/droite). */
export const AdminOnglets = ({ onglets, courant, onChange, label }: { onglets: Onglet[]; courant: string; onChange: (id: string) => void; label: string }) => {
  const clavier = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = (i + (e.key === "ArrowRight" ? 1 : -1) + onglets.length) % onglets.length;
    onChange(onglets[n].id);
    document.getElementById(`onglet-${onglets[n].id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-0 border-b-2 border-foreground mb-6">
      {onglets.map((o, i) => {
        const actif = o.id === courant;
        return (
          <button
            key={o.id}
            id={`onglet-${o.id}`}
            role="tab"
            type="button"
            aria-selected={actif}
            aria-controls={`panneau-${o.id}`}
            tabIndex={actif ? 0 : -1}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => clavier(e, i)}
            className={`-mb-0.5 px-4 py-2.5 text-sm font-semibold border-2 border-b-0 transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              actif ? "bg-foreground text-background border-foreground" : "border-transparent text-foreground hover:bg-muted"
            }`}
          >
            {o.label}
            {!!o.compte && (
              <span className={`ml-2 inline-block min-w-[1.4rem] px-1.5 font-mono text-xs ${actif ? "bg-accent text-accent-foreground" : "bg-accent/90 text-accent-foreground"}`}>
                {o.compte}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export const Panneau = ({ id, children }: { id: string; children: ReactNode }) => (
  <div role="tabpanel" id={`panneau-${id}`} aria-labelledby={`onglet-${id}`} tabIndex={0} className="focus-visible:outline-none">
    {children}
  </div>
);
