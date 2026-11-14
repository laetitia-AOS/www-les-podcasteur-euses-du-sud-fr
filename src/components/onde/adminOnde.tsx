// Petits éléments communs aux pages admin de L'Onde du Sud (mêmes styles que le reste de l'administration).
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatShortDate } from "@/lib/pds";
import { libelleEnvoye } from "@/lib/onde";

export const btnIcone =
  "inline-flex items-center justify-center w-10 h-10 border-2 border-encre bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const btnOutil =
  "inline-flex items-center gap-1.5 h-9 px-3 border-2 border-encre bg-background text-sm font-bold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const Compteur = ({ n, max }: { n: number; max: number }) => (
  <span className={`font-mono text-xs ${n > max ? "text-destructive font-bold" : "text-muted-foreground"}`}>{n} / {max}</span>
);

export const BadgeStatut = ({ statut }: { statut: "brouillon" | "publie" }) =>
  statut === "publie" ? (
    <span className="font-mono text-[11px] uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5">Publié</span>
  ) : (
    <span className="font-mono text-[11px] uppercase tracking-wider border border-encre px-1.5">Brouillon</span>
  );

export const dateHeure = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${formatShortDate(iso)} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
};

/** Message lisible pour une erreur renvoyée par la base. */
export const messageOnde = (e: { code?: string; message?: string } | null | undefined, fallback: string) =>
  e?.code === "23505" ? "Ce numéro existe déjà : choisissez-en un autre."
  : e?.code === "P0001" && e.message ? e.message
  : e?.code === "42501" ? "Vous n'avez pas le droit de faire cette action."
  : fallback;

/** Noms de l'équipe pour « créé par » / « modifié par » (la base ne répond qu'aux admins et éditeur·ices). */
export const useNomsEquipe = (ids: (string | null | undefined)[]) => {
  const liste = [...new Set(ids.filter((i): i is string => !!i))].sort();
  const { data } = useQuery({
    queryKey: ["onde-noms", liste],
    enabled: liste.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("onde_noms", { _ids: liste });
      if (error) throw error;
      const t: Record<string, string> = {};
      (data || []).forEach((r: { id: string; nom: string }) => { t[r.id] = r.nom; });
      return t;
    },
  });
  return (id?: string | null) => (id && data?.[id]) || "";
};


/** Numéros déjà partis par e-mail (la base ne répond qu'aux admins et éditeur·ices). */
export const useEnvoisResume = () => {
  const { data = [] } = useQuery({
    queryKey: ["onde-envois-resume"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("onde_envois_resume");
      if (error) throw error;
      return (data || []) as { numero_id: string; statut: string; termine_le: string | null }[];
    },
  });
  return (id: string) => data.find((e) => e.numero_id === id);
};

/** « Envoyé le 14 novembre 2026 », ou « Envoi à reprendre » s'il a été interrompu. */
export const BadgeEnvoi = ({ envoi }: { envoi?: { statut: string; termine_le: string | null } }) =>
  !envoi ? null : envoi.statut === "termine" ? (
    <span className="font-mono text-[11px] uppercase tracking-wider bg-encre text-surface px-1.5 py-0.5">{libelleEnvoye(envoi.termine_le)}</span>
  ) : (
    <span className="font-mono text-[11px] uppercase tracking-wider border border-destructive text-destructive px-1.5">Envoi à reprendre</span>
  );
