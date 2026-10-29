import { useMemo, useState } from "react";
import { formatName } from "@/lib/pds";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MANQUES, manquesDetectes, relanceRecente, type CodeManque, type ProfilACompleter } from "@/lib/relanceProfil";

const date = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/** Relance individuelle des fiches incomplètes : cases cochées d'office sur les manques, envoi par le site. */
const ProfilsACompleter = () => {
  const qc = useQueryClient();
  const [ouvert, setOuvert] = useState(true);
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<"tous" | CodeManque>("tous");
  const [choix, setChoix] = useState<Record<string, CodeManque[]>>({});
  const [envoi, setEnvoi] = useState<string | null>(null);

  const { data: profils = [], isLoading } = useQuery({
    queryKey: ["admin-profils-a-completer"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_profils_a_completer");
      if (error) throw error;
      return ((data || []) as ProfilACompleter[]).map((p) => ({ ...p, nom: p.nom ? formatName(p.nom) : p.nom })).filter((p) => manquesDetectes(p).length > 0);
    },
  });

  const coches = (p: ProfilACompleter) => choix[p.email] ?? manquesDetectes(p);
  const basculer = (p: ProfilACompleter, code: CodeManque, on: boolean) =>
    setChoix((c) => {
      const cur = c[p.email] ?? manquesDetectes(p);
      return { ...c, [p.email]: on ? MANQUES.map((m) => m.code).filter((x) => x === code || cur.includes(x)) : cur.filter((x) => x !== code) };
    });

  const liste = useMemo(() => {
    const s = q.trim().toLowerCase();
    return profils.filter((p) =>
      (filtre === "tous" || manquesDetectes(p).includes(filtre)) &&
      (!s || (p.nom || "").toLowerCase().includes(s) || p.email.includes(s)));
  }, [profils, q, filtre]);

  const compte = (code: CodeManque) => profils.filter((p) => manquesDetectes(p).includes(code)).length;

  const relancer = async (p: ProfilACompleter) => {
    const manques = coches(p);
    if (!manques.length) { toast.error("Cochez au moins un élément à compléter."); return; }
    setEnvoi(p.email);
    const { data, error } = await supabase.functions.invoke("relance-profil", { body: { email: p.email, manques } });
    setEnvoi(null);
    if (error || !data?.sent) {
      let msg = "La relance n'est pas partie.";
      try { msg = (await (error as any)?.context?.json())?.error || msg; } catch { /* message par défaut */ }
      toast.error(msg);
      return;
    }
    toast.success(`Relance envoyée à ${p.nom || p.email}.`);
    qc.invalidateQueries({ queryKey: ["admin-profils-a-completer"] });
  };

  return (
    <section aria-labelledby="completer-title" className="mb-10 border-2 border-foreground">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        className="w-full flex items-center justify-between gap-4 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span>
          <span id="completer-title" className="block font-display font-bold text-xl">Fiches à compléter</span>
          <span className="block text-sm text-muted-foreground">
            {isLoading ? "Chargement…" : `${profils.length} personne${profils.length > 1 ? "s" : ""} · ${compte("photo")} sans photo de profil · ${compte("pochette")} sans pochette · ${compte("rss")} sans flux · ${compte("collab")} sans « Je cherche / J'apporte »`}
          </span>
        </span>
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform motion-reduce:transition-none ${ouvert ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {ouvert && (
        <div className="border-t-2 border-foreground p-4 space-y-4">
          <p className="text-sm text-muted-foreground max-w-2xl">
            Les manques sont cochés d'office. Décochez ce que vous ne voulez pas mentionner, puis « Relancer » : la personne reçoit
            un e-mail aux couleurs du site qui liste uniquement les éléments cochés, avec un lien vers son espace membre.
            Une seule relance par personne et par 24 heures.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou e-mail" className="max-w-xs" aria-label="Rechercher une personne" />
            <select value={filtre} onChange={(e) => setFiltre(e.target.value as any)} className="h-10 border border-input bg-background px-3 text-sm" aria-label="Filtrer par manque">
              <option value="tous">Tous les manques</option>
              {MANQUES.map((m) => <option key={m.code} value={m.code}>{m.label} ({compte(m.code)})</option>)}
            </select>
          </div>

          <ul className="divide-y divide-border border border-border">
            {liste.map((p) => {
              const detectes = manquesDetectes(p);
              const recente = relanceRecente(p);
              return (
                <li key={p.email} className="p-3 grid gap-3 md:grid-cols-[minmax(0,14rem)_1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">{p.nom || "Sans nom"}</p>
                    <p className="text-xs text-muted-foreground break-all">{p.email}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      {p.derniere_relance ? `Relancé·e le ${date(p.derniere_relance)}${p.nb_relances > 1 ? ` · ${p.nb_relances} relances` : ""}` : "Jamais relancé·e"}
                      {!p.fiche_validee && " · fiche en attente"}
                    </p>
                  </div>
                  <fieldset className="flex flex-wrap gap-x-5 gap-y-2">
                    <legend className="sr-only">Éléments à compléter pour {p.nom || p.email}</legend>
                    {MANQUES.map((m) => {
                      const id = `${p.email}-${m.code}`;
                      const manque = detectes.includes(m.code);
                      return (
                        <label key={m.code} htmlFor={id} className={`flex items-center gap-2 text-sm ${manque ? "" : "text-muted-foreground"}`}>
                          <Checkbox id={id} checked={coches(p).includes(m.code)} onCheckedChange={(v) => basculer(p, m.code, v === true)} />
                          {m.label}
                          {manque && m.code === "pochette" && p.podcasts_sans_pochette.length > 1 && <span className="font-mono text-xs">×{p.podcasts_sans_pochette.length}</span>}
                          {!manque && <span className="text-xs">(déjà là)</span>}
                        </label>
                      );
                    })}
                  </fieldset>
                  <Button size="sm" onClick={() => relancer(p)} disabled={recente || envoi === p.email || !coches(p).length}>
                    <Send className="w-4 h-4 mr-2" aria-hidden />
                    {envoi === p.email ? "Envoi…" : recente ? "Relancé·e aujourd'hui" : "Relancer"}
                  </Button>
                </li>
              );
            })}
            {!isLoading && !liste.length && <li className="p-4 text-sm text-muted-foreground">Aucune fiche à compléter pour ce filtre.</li>}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ProfilsACompleter;
