import { useState } from "react";
import { z } from "zod";
import { btnListen, btnPrimary } from "@/lib/pds";
import { DEPARTEMENTS_SUD, SERVICES_STUDIO, envoyerDevis, phraseDevisEnvoye } from "@/lib/lieux";

const FORMATS = ["Audio", "Vidéo", "Audio et vidéo", "Direct / live"];

const schema = z.object({
  nom: z.string().trim().min(2, "Indiquez votre prénom et votre nom.").max(100, "100 caractères maximum."),
  email: z.string().trim().email("Adresse e-mail invalide.").max(255),
  description: z.string().trim().min(20, "Décrivez votre projet en quelques phrases (20 caractères minimum).").max(2000, "2 000 caractères maximum."),
});

type Props = {
  /** Studio visé : la demande ne part que vers lui. Sinon, demande groupée. */
  studioId?: string | null;
  studioName?: string;
  defaultDepartement?: string;
  defaultBesoins?: string[];
  dark?: boolean;
  idPrefix?: string;
  /** Nom et e-mail déjà saisis (formulaire unique de la fiche studio) et suivi de leur saisie. */
  identite?: { nom: string; email: string };
  onIdentite?: (v: { nom: string; email: string }) => void;
};

/** Formulaire de demande de devis, groupée ou pour un seul studio. */
const DevisForm = ({ studioId, studioName, defaultDepartement = "", defaultBesoins = [], dark = false, idPrefix = "devis", identite, onIdentite }: Props) => {
  const [v, setV] = useState({ nom: identite?.nom || "", email: identite?.email || "", format: FORMATS[0], periode: "", departement: defaultDepartement, description: "", website: "" });
  const [besoins, setBesoins] = useState<string[]>(defaultBesoins);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "none" | "error">("idle");
  const [msg, setMsg] = useState("");

  const field = dark
    ? "w-full min-h-[48px] px-3 bg-encre text-surface border-2 border-surface/70 text-[16px] placeholder:text-surface/55 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent"
    : "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";
  const errCls = dark ? "mt-1 text-sm text-accent" : "mt-1 text-sm text-destructive";
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...v, [e.target.name]: e.target.value };
    setV(next);
    if (onIdentite && (e.target.name === "nom" || e.target.name === "email")) onIdentite({ nom: next.nom, email: next.email });
  };
  const id = (k: string) => `${idPrefix}-${k}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(v);
    const errs: Record<string, string> = {};
    if (!parsed.success) parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
    if (!studioId && !v.departement) errs.departement = "Choisissez un département.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState("sending");
    const r = await envoyerDevis({ ...v, besoins, studio_id: studioId ?? null });
    if (!r.ok) { setMsg(r.message || ""); setState("error"); return; }
    if (r.count === 0) { setMsg(r.message || "Aucun studio ne correspond. Enlevez un besoin ou changez de département."); setState("none"); return; }
    setMsg(phraseDevisEnvoye(r.count));
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div role="status" className="self-center">
        <p className="font-bold text-2xl">{msg}</p>
        <p className={`mt-2 text-[17px] ${dark ? "text-surface/85" : "text-muted-foreground"}`}>
          {studioName ? `${studioName} la retrouve` : "Chaque studio la retrouve"} dans son espace membre et vous répondra directement à votre adresse.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor={id("nom")} className="block text-sm font-bold mb-1.5">Prénom et nom</label>
        <input id={id("nom")} name="nom" value={v.nom} onChange={onChange} autoComplete="name" className={field} aria-invalid={!!errors.nom} aria-describedby={errors.nom ? id("nom-err") : undefined} />
        {errors.nom && <p id={id("nom-err")} className={errCls}>{errors.nom}</p>}
      </div>
      <div>
        <label htmlFor={id("email")} className="block text-sm font-bold mb-1.5">E-mail</label>
        <input id={id("email")} name="email" type="email" value={v.email} onChange={onChange} autoComplete="email" className={field} aria-invalid={!!errors.email} aria-describedby={errors.email ? id("email-err") : undefined} />
        {errors.email && <p id={id("email-err")} className={errCls}>{errors.email}</p>}
      </div>
      <div>
        <label htmlFor={id("format")} className="block text-sm font-bold mb-1.5">Format</label>
        <select id={id("format")} name="format" value={v.format} onChange={onChange} className={field}>
          {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={id("periode")} className="block text-sm font-bold mb-1.5">Période</label>
        <input id={id("periode")} name="periode" value={v.periode} onChange={onChange} maxLength={80} placeholder="Date ou période" className={field} />
      </div>
      {!studioId && (
        <div className="sm:col-span-2">
          <label htmlFor={id("departement")} className="block text-sm font-bold mb-1.5">Département</label>
          <select id={id("departement")} name="departement" value={v.departement} onChange={onChange} className={field} aria-invalid={!!errors.departement}>
            <option value="">Choisir</option>
            {DEPARTEMENTS_SUD.map((d) => <option key={d.code} value={d.code}>{d.label} ({d.code})</option>)}
          </select>
          {errors.departement && <p className={errCls}>{errors.departement}</p>}
        </div>
      )}
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-bold mb-2">Besoins</legend>
        <div className="flex flex-wrap gap-2">
          {SERVICES_STUDIO.map((s) => {
            const on = besoins.includes(s.value);
            return (
              <label key={s.value} className={`min-h-[44px] px-3 inline-flex items-center gap-2 border cursor-pointer text-[15px] font-semibold ${
                on ? (dark ? "bg-surface text-encre border-surface" : "bg-encre text-surface border-encre") : dark ? "border-surface/70" : "border-encre bg-surface"
              }`}>
                <input type="checkbox" className="w-4 h-4 accent-accent" checked={on}
                  onChange={() => setBesoins((b) => (on ? b.filter((x) => x !== s.value) : [...b, s.value]))} />
                {s.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="sm:col-span-2">
        <label htmlFor={id("description")} className="block text-sm font-bold mb-1.5">Description du projet</label>
        <textarea id={id("description")} name="description" rows={4} maxLength={2000} value={v.description} onChange={onChange}
          placeholder="Nombre de voix, nombre d'épisodes, montage ou non…" className={`${field} py-2 resize-y`}
          aria-invalid={!!errors.description} aria-describedby={`${id("description-count")}${errors.description ? ` ${id("description-err")}` : ""}`} />
        <p id={id("description-count")} className={`mt-1 font-mono text-sm ${dark ? "text-surface/70" : "text-muted-foreground"}`}>{v.description.length}/2000</p>
        {errors.description && <p id={id("description-err")} className={errCls}>{errors.description}</p>}
      </div>
      <div className="hidden" aria-hidden>
        <label htmlFor={id("website")}>Site web</label>
        <input id={id("website")} name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={onChange} />
      </div>
      {(state === "error" || state === "none") && <p role="alert" className={`sm:col-span-2 font-semibold ${dark ? "text-accent" : "text-destructive"}`}>{msg}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={state === "sending"} className={`${dark ? btnListen : btnPrimary} px-7`}>
          {state === "sending" ? "Envoi…" : studioName ? `Envoyer à ${studioName}` : "Envoyer ma demande"}
        </button>
        <p className={`mt-2 text-sm ${dark ? "text-surface/70" : "text-muted-foreground"}`}>3 demandes par jour au maximum. L'adresse des studios n'est jamais affichée.</p>
      </div>
    </form>
  );
};

export default DevisForm;
