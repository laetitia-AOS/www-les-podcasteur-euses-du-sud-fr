import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, btnSecondary } from "@/lib/pds";
import { messageServeur } from "@/lib/inscription";

const schema = z.object({
  nom: z.string().trim().min(2, "Indiquez votre nom.").max(100),
  email: z.string().trim().email("Adresse e-mail invalide.").max(255),
});

const field = "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

/** Nombre de personnes qui viennent : jamais les noms (lecture serveur limitée au nombre). */
export const useNbVenues = (id?: string) =>
  useQuery({
    queryKey: ["nb-venues", id],
    queryFn: async () => {
      const { data } = await supabase.rpc("nb_venues", { _evenement_id: id! });
      return (data as number | null) ?? 0;
    },
    enabled: !!id,
  });

export const phraseVenues = (n: number) =>
  n === 0 ? "Soyez la première personne à venir." : n === 1 ? "1 personne vient" : `${n} personnes viennent`;

/** « Je viens » : un clic pour un compte connecté, nom et e-mail pour un visiteur. */
const JeViens = ({ evenementId, places }: { evenementId: string; places: number | null }) => {
  const qc = useQueryClient();
  const { data: nb = 0 } = useNbVenues(evenementId);
  const [session, setSession] = useState<{ email: string; nom: string } | null>(null);
  const [deja, setDeja] = useState(false);
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ nom: "", email: "", website: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const complet = places != null && nb >= places;

  useEffect(() => {
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s?.user?.email) return;
      const { data: fiche } = await supabase.from("podcasts").select("prenom, nom, nom_podcast").eq("email", s.user.email).limit(1).maybeSingle();
      const nom = [fiche?.prenom, fiche?.nom].filter(Boolean).join(" ") || fiche?.nom_podcast || s.user.email.split("@")[0];
      setSession({ email: s.user.email, nom });
      const { data } = await supabase.rpc("je_viens_deja", { _evenement_id: evenementId });
      setDeja(!!data);
    })();
  }, [evenementId]);

  const enregistrer = async (nom: string, email: string) => {
    setState("sending");
    const [prenom, ...reste] = nom.trim().split(/\s+/);
    const { error } = await supabase.from("evenement_inscriptions").insert({ evenement_id: evenementId, prenom, nom: reste.join(" "), email });
    if (error) {
      setMsg(error.code === "23505" ? "Vous êtes déjà noté·e pour cet événement." : messageServeur(error, "Ça n'a pas marché. Réessayez dans un instant."));
      setState(error.code === "23505" ? "ok" : "error");
      if (error.code === "23505") setDeja(true);
      return;
    }
    setDeja(true);
    setMsg("C'est noté, à bientôt. Une confirmation arrive par e-mail.");
    // E-mail de confirmation (n'empêche jamais l'inscription)
    supabase.functions.invoke("confirmer-venue", { body: { evenement_id: evenementId, email: email.trim().toLowerCase() } }).catch(() => {});
    setState("ok");
    qc.invalidateQueries({ queryKey: ["nb-venues", evenementId] });
  };

  const submitVisiteur = (e: React.FormEvent) => {
    e.preventDefault();
    if (v.website) return;
    const p = schema.safeParse(v);
    if (!p.success) {
      const x: Record<string, string> = {};
      p.error.issues.forEach((i) => (x[String(i.path[0])] = i.message));
      setErr(x);
      return;
    }
    setErr({});
    enregistrer(p.data.nom, p.data.email);
  };

  return (
    <div className="space-y-3">
      <p className="font-mono text-sm" aria-live="polite">{phraseVenues(nb)}{places != null ? ` · ${Math.max(places - nb, 0)} place${places - nb > 1 ? "s" : ""} restante${places - nb > 1 ? "s" : ""}` : ""}</p>
      {deja || state === "ok" ? (
        <p role="status" className="font-bold">{msg || "Vous venez, c'est noté."}</p>
      ) : complet ? (
        <p className="font-bold">Complet : toutes les places sont prises.</p>
      ) : session ? (
        <button type="button" onClick={() => enregistrer(session.nom, session.email)} disabled={state === "sending"} className={`${btnPrimary} w-full`}>
          {state === "sending" ? "Un instant…" : "Je viens"}
        </button>
      ) : !open ? (
        <button type="button" onClick={() => setOpen(true)} className={`${btnPrimary} w-full`} aria-expanded={false}>Je viens</button>
      ) : (
        <form onSubmit={submitVisiteur} noValidate className="space-y-3">
          <div>
            <label htmlFor="jv-nom" className="block text-sm font-bold mb-1">Votre nom</label>
            <input id="jv-nom" value={v.nom} onChange={(e) => setV({ ...v, nom: e.target.value })} autoComplete="name" className={field} aria-invalid={!!err.nom} autoFocus />
            {err.nom && <p className="mt-1 text-sm text-destructive">{err.nom}</p>}
          </div>
          <div>
            <label htmlFor="jv-email" className="block text-sm font-bold mb-1">Votre e-mail</label>
            <input id="jv-email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" className={field} aria-invalid={!!err.email} />
            {err.email && <p className="mt-1 text-sm text-destructive">{err.email}</p>}
          </div>
          <div className="hidden" aria-hidden>
            <label htmlFor="jv-website">Site web</label>
            <input id="jv-website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} />
          </div>
          <button type="submit" disabled={state === "sending"} className={`${btnPrimary} w-full`}>{state === "sending" ? "Un instant…" : "Je viens"}</button>
          <button type="button" onClick={() => setOpen(false)} className={`${btnSecondary} w-full`}>Annuler</button>
          <p className="text-xs text-muted-foreground">Votre nom n'est jamais affiché sur le site : seul l'organisateur le voit.</p>
        </form>
      )}
      {state === "error" && <p role="alert" className="text-destructive font-semibold">{msg}</p>}
    </div>
  );
};

export default JeViens;
