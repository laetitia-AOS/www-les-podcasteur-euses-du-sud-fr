import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { messageServeur } from "@/lib/inscription";
import { DEPARTEMENTS_ACCUEIL, dateAtelier, libelleDepartement, messagePresentation, type FichePresentation } from "@/lib/accueil";
import { btnPrimary, btnSecondary, cleanCity, linkUnderline } from "@/lib/pds";
import GroupeWhatsapp from "./GroupeWhatsapp";
import MessagePresentation from "./MessagePresentation";
import { useMonAccueil, type ProchainAtelier } from "./useMonAccueil";

const fieldCls = "w-full min-h-[48px] px-3 bg-background border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

/** Choix du département (liste fermée, vérifiée en base). */
export const ChoixDepartement = ({ valeur, onChoisi, libelle = "Ton département" }: { valeur?: string | null; onChoisi: (c: string) => Promise<void>; libelle?: string }) => {
  const [code, setCode] = useState(valeur || "");
  const [envoi, setEnvoi] = useState(false);
  return (
    <form
      className="flex flex-col sm:flex-row sm:items-end gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code) { toast.error("Choisis ton département."); return; }
        setEnvoi(true);
        try { await onChoisi(code); toast.success("Département enregistré."); }
        catch (err) { toast.error(messageServeur(err as { message?: string }, "Le département n'a pas pu être enregistré.")); }
        finally { setEnvoi(false); }
      }}
    >
      <div className="flex-1 max-w-[360px]">
        <label htmlFor="accueil-dept" className="block text-sm font-bold mb-1.5">{libelle}<span aria-hidden> *</span></label>
        <select id="accueil-dept" value={code} onChange={(e) => setCode(e.target.value)} className={fieldCls} required>
          <option value="">Choisir</option>
          {DEPARTEMENTS_ACCUEIL.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
        </select>
      </div>
      <button type="submit" disabled={envoi} className={btnPrimary}>{envoi ? "Enregistrement…" : "Enregistrer mon département"}</button>
    </form>
  );
};

const Etapes = ({ atelier }: { atelier: ProchainAtelier | null }) => (
  <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {[
      <><Link to="/mon-espace#profil" className={linkUnderline}>Complète ta fiche</Link> : photo, ce que tu cherches, ce que tu apportes.</>,
      <>Rejoins le groupe WhatsApp de ton département.</>,
      <>Présente-toi dans le groupe : ton message est prêt ci-dessous.</>,
      atelier
        ? <>Viens au prochain atelier d'écoute : <Link to={`/agenda/${atelier.slug}`} className={linkUnderline}><span className="font-mono">{dateAtelier(atelier.date_debut)}</span></Link>{atelier.lieu ? <>, {cleanCity(atelier.lieu) || atelier.lieu}</> : null}.</>
        : <>Viens au prochain atelier d'écoute : les dates sont dans <Link to="/agenda" className={linkUnderline}>l'agenda</Link>.</>,
    ].map((t, i) => (
      <li key={i} className="border-t-4 border-primary bg-surface p-4">
        <span className="block font-mono text-xs text-muted-foreground">{i + 1}</span>
        <span className="block mt-1 text-[15px]">{t}</span>
      </li>
    ))}
  </ol>
);

/**
 * Accueil d'une nouvelle personne : comment participer, groupe WhatsApp de son département, message de présentation,
 * bouton « J'ai rejoint le groupe ». Le lien du groupe n'apparaît que pour la personne connectée (lu en base) ;
 * sans connexion, on renvoie vers l'e-mail de bienvenue ou la connexion.
 */
const AccueilMembre = ({
  variante = "page",
  fichesFormulaire,
}: {
  /** « page » : page de confirmation ; « espace » : encart de l'espace membre ; « compact » : fin d'inscription. */
  variante?: "page" | "espace" | "compact";
  /** Ce que la personne vient de saisir (inscription sans connexion), pour pré-remplir le message. */
  fichesFormulaire?: FichePresentation[];
}) => {
  const a = useMonAccueil();
  const [envoi, setEnvoi] = useState(false);
  const [changer, setChanger] = useState(false);
  if (a.chargement) return <p className="font-mono text-sm text-muted-foreground" aria-live="polite">Chargement…</p>;

  const fiches = a.fiches.length ? a.fiches : fichesFormulaire || [];
  const message = messagePresentation(fiches);
  const rejoint = a.accueil?.whatsapp_rejoint_le;

  const rejoindre = async () => {
    setEnvoi(true);
    try { await a.rejoindre(); toast.success("C'est noté, bienvenue dans le groupe !"); }
    catch (err) { toast.error(messageServeur(err as { message?: string }, "Ça n'a pas fonctionné. Réessaie.")); }
    finally { setEnvoi(false); }
  };

  const blocGroupe = !a.connecte ? (
    <div className="border-2 border-encre bg-background p-5">
      <p className="font-bold text-[17px]">Le lien du groupe de ton département est dans ton e-mail de bienvenue</p>
      <p className="mt-2 text-[15px] max-w-[60ch]">
        Pour qu'il reste entre membres, il n'apparaît pas sur le site sans connexion. Connecte-toi avec ton adresse e-mail pour le voir ici.
      </p>
      <Link to="/espace-membre?retour=/bienvenue/accueil" className={`${btnSecondary} mt-4`}>Me connecter</Link>
    </div>
  ) : !a.connu ? (
    <p className="text-[15px]">Aucune fiche ni adhésion n'est enregistrée avec cette adresse : le groupe s'affichera ici une fois ta fiche créée.</p>
  ) : !a.accueil?.departement || changer ? (
    <div className="border-2 border-accent bg-accent/10 p-5">
      <p className="font-bold text-[17px]">{changer ? "Change ton département" : "Dis-nous d'abord ton département"}</p>
      <p className="mt-1 mb-4 text-[15px]">Chaque groupe WhatsApp correspond à un ou plusieurs départements.</p>
      <ChoixDepartement valeur={a.accueil?.departement} onChoisi={async (c) => { await a.definirDepartement(c); setChanger(false); }} />
    </div>
  ) : a.accueil.groupe_lien && a.accueil.groupe_nom ? (
    <div>
      <GroupeWhatsapp nom={a.accueil.groupe_nom} lien={a.accueil.groupe_lien} />
      <p className="mt-3 text-sm text-muted-foreground">
        Ton département : <span className="font-mono">{libelleDepartement(a.accueil.departement)}</span>.{" "}
        <button type="button" onClick={() => setChanger(true)} className="underline underline-offset-2 min-h-[44px]">Changer</button>
      </p>
    </div>
  ) : (
    <p className="text-[15px]">Aucun groupe n'est encore prévu pour ton département : écris-nous à podcastsdusud@gmail.com.</p>
  );

  const boutonRejoint = a.connecte && a.connu && a.accueil?.departement && !changer ? (
    rejoint ? (
      <p role="status" className="mt-5 font-bold text-[15px]">C'est noté : tu as rejoint le groupe le <span className="font-mono font-normal">{new Date(rejoint).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>.</p>
    ) : (
      <button type="button" onClick={rejoindre} disabled={envoi} className={`${btnSecondary} mt-5`}>{envoi ? "Enregistrement…" : "J'ai rejoint le groupe"}</button>
    )
  ) : null;

  if (variante === "espace") {
    return (
      <div className={rejoint ? "bg-surface border border-filet p-5 sm:p-7" : "border-2 border-primary bg-primary/5 p-5 sm:p-7"}>
        <h2 id="whatsapp-title" className="title-section text-[28px] sm:text-[34px]">{rejoint ? "Ton groupe WhatsApp" : "Rejoins le groupe de ton département"}</h2>
        {!rejoint && <p className="mt-2 mb-5 text-[15px] max-w-[62ch]">C'est là que circulent les ateliers d'écoute, les appels à création et les propositions du moment.</p>}
        <div className={rejoint ? "mt-4" : ""}>{blocGroupe}</div>
        {boutonRejoint}
        {!rejoint && a.connu && <div className="mt-7 max-w-[680px]"><MessagePresentation message={message} id="message-espace" /></div>}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="participer-title">
        <h2 id="participer-title" className="title-section text-[30px] sm:text-[36px] mb-4">Comment participer</h2>
        <Etapes atelier={a.atelier} />
      </section>
      <section aria-labelledby="groupe-title">
        <h2 id="groupe-title" className="title-section text-[30px] sm:text-[36px] mb-4">Ton groupe WhatsApp</h2>
        {blocGroupe}
        {boutonRejoint}
      </section>
      {variante !== "compact" || fiches.length ? (
        <section aria-labelledby="presentation-title" className="max-w-[680px]">
          <h2 id="presentation-title" className="sr-only">Message de présentation</h2>
          <MessagePresentation message={message} id={`message-${variante}`} />
        </section>
      ) : null}
    </div>
  );
};

export default AccueilMembre;
