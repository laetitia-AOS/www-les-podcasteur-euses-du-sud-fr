// « Recevoir L'Onde du Sud chaque mois » : formulaire d'abonnement, sur /onde, en bas des numéros,
// dans le pied de page et sur l'accueil. Le serveur (onde_inscrire) vérifie l'adresse, enregistre le
// consentement et limite les envois répétés. Un·e adhérent·e à jour connecté·e voit un message à la place :
// « Tu reçois déjà… », ou « Tu ne reçois plus… » + « Me réabonner » s'il ou elle s'est désinscrit·e.
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { btnPrimary, linkUnderline } from "@/lib/pds";
import { messageServeur } from "@/lib/inscription";
import { CONSENTEMENT_ONDE, NOM_ONDE, inscrireOnde } from "@/lib/onde";
import { reabonnerMembre, retenirAbonnement, useEtatLecteur, type EtatLecteur } from "@/lib/ondePied";
import { ONDE_DEPOSER } from "@/lib/ondeDepots";

const schema = z.object({
  prenom: z.string().trim().min(1, "Indiquez votre prénom.").max(100, "100 caractères au maximum."),
  nom: z.string().trim().min(1, "Indiquez votre nom.").max(100, "100 caractères au maximum."),
  email: z.string().trim().email("Adresse e-mail invalide.").max(255),
  consentement: z.literal(true, { errorMap: () => ({ message: "Cochez la case pour recevoir L'Onde du Sud." }) }),
});

const field = "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

/**
 * Message montré à la place du formulaire à un·e adhérent·e à jour connecté·e.
 * « depot » : lien « Déposer pour L'Onde » (pied de page, accueil) ; absent sur /onde et les numéros,
 * où l'encart de dépôt est juste en dessous.
 */
export const DejaMembreOnde = ({ className = "", depot = false }: { className?: string; depot?: boolean }) => (
  <div role="status" className={className}>
    <p className="text-[17px] font-bold max-w-[60ch]">Tu reçois déjà {NOM_ONDE} en tant que membre.</p>
    {depot && (
      <Link to={ONDE_DEPOSER} className={`${linkUnderline} mt-2 inline-flex min-h-[44px] items-center`}>
        Déposer pour L'Onde<span aria-hidden>&nbsp;→</span>
      </Link>
    )}
  </div>
);

/** Adhérent·e à jour connecté·e qui s'est désinscrit·e : réabonnement en un clic (adresse lue dans la session). */
export const PlusAbonneOnde = ({ className = "" }: { className?: string }) => {
  const qc = useQueryClient();
  const [etat, setEtat] = useState<"idle" | "envoi" | "erreur">("idle");
  const [msg, setMsg] = useState("");
  const reabonner = async () => {
    setEtat("envoi");
    try {
      await reabonnerMembre();
      qc.setQueryData<EtatLecteur>(["onde-membre"], "membre");
      setEtat("idle");
    } catch (e) {
      setMsg(messageServeur(e as { code?: string; message?: string }, "Le réabonnement n'a pas pu être enregistré. Réessaie dans un instant."));
      setEtat("erreur");
    }
  };
  return (
    <div role="status" className={className}>
      <p className="text-[17px] font-bold max-w-[60ch]">Tu ne reçois plus {NOM_ONDE}.</p>
      <button type="button" onClick={reabonner} disabled={etat === "envoi"} className={`${btnPrimary} mt-3`}>
        {etat === "envoi" ? "Un instant…" : "Me réabonner"}
      </button>
      {etat === "erreur" && <p role="alert" className="mt-2 text-destructive font-semibold">{msg}</p>}
    </div>
  );
};

/** Message à la place du formulaire pour un·e adhérent·e à jour connecté·e ; null sinon. */
export const MessageMembreOnde = ({ etat, className = "", depot = false }: { etat: EtatLecteur | undefined; className?: string; depot?: boolean }) =>
  etat === "membre" ? <DejaMembreOnde className={className} depot={depot} />
  : etat === "membre_desinscrit" ? <PlusAbonneOnde className={className} />
  : null;

/** Champs, case et bouton. « ligne » : version compacte (pied de page, accueil), bouton « Je m'abonne ». */
export const FormulaireOnde = ({ ligne = false }: { ligne?: boolean }) => {
  const id = useId();
  const [v, setV] = useState({ prenom: "", nom: "", email: "", consentement: false, website: "" });
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
    const { error } = await inscrireOnde(p.data.prenom, p.data.email, "onde", p.data.nom);
    if (error) {
      setMsg(messageServeur(error, "L'inscription n'a pas pu être enregistrée. Réessayez dans un instant."));
      setEtat("erreur");
      return;
    }
    retenirAbonnement(true);
    setEtat("ok");
  };

  if (etat === "ok") {
    return (
      <p role="status" className={`${ligne ? "" : "mt-3"} text-[17px] font-bold max-w-[60ch]`}>
        C'est noté : vous recevrez le prochain numéro de L'Onde du Sud par e-mail.
      </p>
    );
  }

  const bouton = (
    <button type="submit" disabled={etat === "envoi"} className={`${btnPrimary} ${ligne ? "w-full sm:w-auto" : ""}`}>
      {etat === "envoi" ? "Un instant…" : ligne ? "Je m'abonne" : "Je m'inscris"}
    </button>
  );

  return (
    <form onSubmit={envoyer} noValidate className={ligne ? "space-y-3" : "mt-5 space-y-4"} aria-label={ligne ? `S'abonner à ${NOM_ONDE}` : undefined}>
      <div className={ligne ? "grid sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-3 lg:items-end" : "grid sm:grid-cols-3 gap-4"}>
        <div>
          <label htmlFor={`${id}-prenom`} className="block text-sm font-bold mb-1">Prénom</label>
          <input id={`${id}-prenom`} value={v.prenom} onChange={(e) => setV({ ...v, prenom: e.target.value })} autoComplete="given-name" className={field} aria-invalid={!!err.prenom} aria-describedby={err.prenom ? `${id}-e-prenom` : undefined} />
          {err.prenom && <p id={`${id}-e-prenom`} className="mt-1 text-sm text-destructive">{err.prenom}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-nom`} className="block text-sm font-bold mb-1">Nom</label>
          <input id={`${id}-nom`} value={v.nom} onChange={(e) => setV({ ...v, nom: e.target.value })} autoComplete="family-name" className={field} aria-invalid={!!err.nom} aria-describedby={err.nom ? `${id}-e-nom` : undefined} />
          {err.nom && <p id={`${id}-e-nom`} className="mt-1 text-sm text-destructive">{err.nom}</p>}
        </div>
        <div className={ligne ? "sm:col-span-2 lg:col-span-1" : ""}>
          <label htmlFor={`${id}-email`} className="block text-sm font-bold mb-1">E-mail</label>
          <input id={`${id}-email`} type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" className={field} aria-invalid={!!err.email} aria-describedby={err.email ? `${id}-e-email` : undefined} />
          {err.email && <p id={`${id}-e-email`} className="mt-1 text-sm text-destructive">{err.email}</p>}
        </div>
        {ligne && <div className="hidden lg:block self-start pt-6">{bouton}</div>}
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
      {ligne ? <div className="lg:hidden">{bouton}</div> : bouton}
      {etat === "erreur" && <p role="alert" className="text-destructive font-semibold">{msg}</p>}
    </form>
  );
};

/**
 * Encadré complet (/onde, bas des numéros). « ancre » : identifiant pour les liens /onde#recevoir.
 * « mention » : courte ligne au-dessus du titre (ex. « Le premier numéro arrive en décembre »).
 */
const InscriptionOnde = ({ className = "", ancre, mention }: { className?: string; ancre?: string; mention?: string }) => {
  const id = useId();
  const { data: lecteur } = useEtatLecteur();
  const membre = lecteur === "membre" || lecteur === "membre_desinscrit";

  return (
    <section id={ancre} aria-labelledby={`${id}-titre`} className={`scroll-mt-24 border-2 border-encre bg-surface p-5 sm:p-7 ${className}`}>
      {mention && <p className="font-mono text-sm font-bold uppercase tracking-wider text-primary mb-2">{mention}</p>}
      <h2 id={`${id}-titre`} className="title-section text-[26px] sm:text-[32px]">Recevoir {NOM_ONDE} chaque mois</h2>
      {membre ? (
        <MessageMembreOnde etat={lecteur} className="mt-3" />
      ) : (
        <>
          <p className="mt-2 text-[15px] max-w-[60ch]">
            Un numéro par mois dans votre boîte mail. Adhérent·e à jour ? Vous la recevez déjà.
          </p>
          <FormulaireOnde />
        </>
      )}
    </section>
  );
};

export default InscriptionOnde;
