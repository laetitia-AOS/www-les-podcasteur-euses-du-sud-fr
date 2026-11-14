// « Recevoir L'Onde du Sud chaque mois » : petit formulaire sur /onde et en bas de chaque numéro.
// Le serveur (onde_inscrire) vérifie l'adresse, enregistre le consentement et limite les envois répétés.
import { useId, useState } from "react";
import { z } from "zod";
import { btnPrimary } from "@/lib/pds";
import { messageServeur } from "@/lib/inscription";
import { CONSENTEMENT_ONDE, NOM_ONDE, inscrireOnde } from "@/lib/onde";

const schema = z.object({
  prenom: z.string().trim().min(1, "Indiquez votre prénom.").max(100, "100 caractères au maximum."),
  email: z.string().trim().email("Adresse e-mail invalide.").max(255),
  consentement: z.literal(true, { errorMap: () => ({ message: "Cochez la case pour recevoir L'Onde du Sud." }) }),
});

const field = "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

const InscriptionOnde = ({ className = "" }: { className?: string }) => {
  const id = useId();
  const [v, setV] = useState({ prenom: "", email: "", consentement: false, website: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [etat, setEtat] = useState<"idle" | "envoi" | "ok" | "erreur">("idle");
  const [msg, setMsg] = useState("");

  const envoyer = async (e: React.FormEvent) => {
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
    setEtat("envoi");
    const { error } = await inscrireOnde(p.data.prenom, p.data.email, "onde");
    if (error) {
      setMsg(messageServeur(error, "L'inscription n'a pas pu être enregistrée. Réessayez dans un instant."));
      setEtat("erreur");
      return;
    }
    setEtat("ok");
  };

  return (
    <section aria-labelledby={`${id}-titre`} className={`border-2 border-encre bg-surface p-5 sm:p-7 ${className}`}>
      <h2 id={`${id}-titre`} className="title-section text-[26px] sm:text-[32px]">Recevoir {NOM_ONDE} chaque mois</h2>
      {etat === "ok" ? (
        <p role="status" className="mt-3 text-[17px] font-bold max-w-[60ch]">
          C'est noté. Pour finir, confirmez votre inscription grâce au lien qui vous sera envoyé par e-mail.
        </p>
      ) : (
        <>
          <p className="mt-2 text-[15px] max-w-[60ch]">
            Un numéro par mois dans votre boîte mail. Adhérent·e à jour ? Vous la recevez déjà.
          </p>
          <form onSubmit={envoyer} noValidate className="mt-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${id}-prenom`} className="block text-sm font-bold mb-1">Prénom</label>
                <input id={`${id}-prenom`} value={v.prenom} onChange={(e) => setV({ ...v, prenom: e.target.value })} autoComplete="given-name" className={field} aria-invalid={!!err.prenom} aria-describedby={err.prenom ? `${id}-e-prenom` : undefined} />
                {err.prenom && <p id={`${id}-e-prenom`} className="mt-1 text-sm text-destructive">{err.prenom}</p>}
              </div>
              <div>
                <label htmlFor={`${id}-email`} className="block text-sm font-bold mb-1">E-mail</label>
                <input id={`${id}-email`} type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" className={field} aria-invalid={!!err.email} aria-describedby={err.email ? `${id}-e-email` : undefined} />
                {err.email && <p id={`${id}-e-email`} className="mt-1 text-sm text-destructive">{err.email}</p>}
              </div>
            </div>
            <div>
              <label htmlFor={`${id}-consentement`} className="flex items-start gap-3 text-[15px] cursor-pointer">
                <input
                  id={`${id}-consentement`}
                  type="checkbox"
                  checked={v.consentement}
                  onChange={(e) => setV({ ...v, consentement: e.target.checked })}
                  className="mt-1 h-5 w-5 shrink-0 accent-primary"
                  aria-invalid={!!err.consentement}
                  aria-describedby={err.consentement ? `${id}-e-consentement` : undefined}
                />
                <span>{CONSENTEMENT_ONDE}</span>
              </label>
              {err.consentement && <p id={`${id}-e-consentement`} className="mt-1 text-sm text-destructive">{err.consentement}</p>}
            </div>
            <div className="hidden" aria-hidden>
              <label htmlFor={`${id}-website`}>Site web</label>
              <input id={`${id}-website`} tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} />
            </div>
            <button type="submit" disabled={etat === "envoi"} className={btnPrimary}>
              {etat === "envoi" ? "Un instant…" : "Je m'inscris"}
            </button>
            {etat === "erreur" && <p role="alert" className="text-destructive font-semibold">{msg}</p>}
          </form>
        </>
      )}
    </section>
  );
};

export default InscriptionOnde;
