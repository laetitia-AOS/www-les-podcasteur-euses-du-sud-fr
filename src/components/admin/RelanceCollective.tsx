import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { anneeEnCours } from "@/lib/espaceMembre";
import type { MembreAdmin } from "@/components/admin/AdminMembres";

const SITE = "https://www.les-podcasteur-euses-du-sud.fr";

type Relance = "1dec" | "20dec" | "15jan" | "sursis";

/** Message de chaque relance collective (envoyé depuis la boîte mail de l'équipe, en copie cachée). */
export const messageRelance = (r: Relance, y: number) => {
  // En janvier, on relance les membres de l'année précédente pour l'année en cours
  const base = r === "15jan" ? y - 1 : y;
  const cible = r === "1dec" || r === "20dec" ? y + 1 : y;
  const lien = `${SITE}/rejoindre-association?etape=adhesion&pour=${cible}`;
  const espace = `${SITE}/espace-membre`;
  const fin = "Utilisez la même adresse e-mail que pour votre profil : c'est elle qui relie le paiement à votre fiche.";
  const signature = "L'équipe des Podcasteur·euses du Sud";
  if (r === "1dec") return {
    sujet: `Renouvelez votre adhésion pour ${cible}`,
    corps: `Bonjour,\n\nVotre adhésion aux Podcasteur·euses du Sud est valable jusqu'au 31 décembre ${base}. Le renouvellement pour ${cible} est ouvert dès aujourd'hui.\n\nRenouveler pour ${cible} : ${lien}\n${fin}\n\nVotre espace membre : ${espace}\n\nSans renouvellement, votre fiche reste visible en janvier, puis elle est masquée du site le 1er février. Rien n'est supprimé : elle réapparaît dès votre paiement.\n\n${signature}`,
  };
  if (r === "20dec") return {
    sujet: `Adhésion ${cible} : pensez à renouveler`,
    corps: `Bonjour,\n\nVotre adhésion ${base} se termine le 31 décembre. Pour que votre fiche et vos podcasts restent visibles en ${cible}, renouvelez dès maintenant.\n\nRenouveler pour ${cible} : ${lien}\n${fin}\n\nVotre espace membre : ${espace}\n\n${signature}`,
  };
  if (r === "15jan") return {
    sujet: `Votre fiche sera masquée le 1er février`,
    corps: `Bonjour,\n\nVotre adhésion ${base} est terminée depuis le 31 décembre. Votre fiche reste visible jusqu'au 31 janvier ; sans renouvellement, elle sera masquée du site le 1er février (rien n'est supprimé).\n\nRenouveler pour ${cible} : ${lien}\n${fin}\n\nVotre espace membre : ${espace}\n\n${signature}`,
  };
  return {
    sujet: `Votre fiche dans l'annuaire : adhésion ${cible}`,
    corps: `Bonjour,\n\nVotre fiche est visible dans l'annuaire des Podcasteur·euses du Sud, mais votre adhésion ${cible} n'est pas encore réglée. L'adhésion est valable jusqu'au 31 décembre ${cible}.\n\nAdhérer pour ${cible} : ${lien}\n${fin}\n\nVotre espace membre : ${espace}\n\n${signature}`,
  };
};

/** Destinataires de chaque relance, d'après la liste des membres (aucune adresse n'est envoyée ailleurs). */
export const destinatairesRelance = (r: Relance, membres: MembreAdmin[], y: number) =>
  membres.filter((m) =>
    r === "1dec" || r === "20dec" ? m.etat === "a_jour" && m.annee === y
      : r === "15jan" ? m.annee === y - 1 && m.etat !== "a_jour"
      : m.sursis);

const RELANCES: { id: Relance; label: string; quand: string }[] = [
  { id: "1dec", label: "1er décembre", quand: "Ouverture du renouvellement" },
  { id: "20dec", label: "20 décembre", quand: "Rappel avant la fin d'année" },
  { id: "15jan", label: "15 janvier", quand: "Avant le masquage du 1er février" },
  { id: "sursis", label: "Fiches en attente", quand: "Fiches visibles sans adhésion" },
];

/**
 * Relance collective : prépare le message et la liste des adresses, envoyés depuis la boîte mail de l'équipe
 * (copie cachée). Les e-mails du site sont réservés aux messages individuels.
 */
const RelanceCollective = ({ membres, onClose }: { membres: MembreAdmin[]; onClose: () => void }) => {
  const y = anneeEnCours();
  const [r, setR] = useState<Relance>(new Date().getMonth() === 0 ? "15jan" : "1dec");
  const msg = messageRelance(r, y);
  const dest = useMemo(() => destinatairesRelance(r, membres, y), [r, membres, y]);
  const adresses = dest.map((m) => m.email).join(", ");
  // Message personnalisé pour un seul membre (« Bonjour Alix, »)
  const mailtoMembre = (mb: MembreAdmin) => {
    const prenom = mb.nom && !mb.nom.includes("@") ? mb.nom.split(/\s+/)[0] : "";
    const corps = prenom ? msg.corps.replace(/^Bonjour,/, `Bonjour ${prenom},`) : msg.corps;
    return `mailto:${encodeURIComponent(mb.email)}?subject=${encodeURIComponent(msg.sujet)}&body=${encodeURIComponent(corps)}`;
  };
  const [faits, setFaits] = useState<Set<string>>(new Set());
  const mailto = `mailto:?bcc=${encodeURIComponent(dest.map((m) => m.email).join(","))}&subject=${encodeURIComponent(msg.sujet)}&body=${encodeURIComponent(msg.corps)}`;

  const copier = async (texte: string, quoi: string) => {
    try { await navigator.clipboard.writeText(texte); toast.success(`${quoi} copié${quoi === "Les adresses" ? "es" : ""}.`); }
    catch { toast.error("La copie n'a pas fonctionné : sélectionnez le texte à la main."); }
  };

  return (
    <section aria-labelledby="relance-title" className="mb-8 border-2 border-primary p-5 bg-background">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="relance-title" className="font-display font-bold text-xl">Relance collective</h3>
          <p className="text-sm text-muted-foreground max-w-prose mt-1">
            Le message part de votre boîte mail. « Écrire » ouvre un e-mail personnalisé pour un membre ; « Ouvrir dans ma messagerie » prépare un envoi à tous, en copie cachée (Cci).
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer la relance"><X className="w-4 h-4" /></Button>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-bold mb-2">Quelle relance ?</legend>
        <div className="flex flex-wrap gap-2">
          {RELANCES.map((x) => (
            <label key={x.id} className={`cursor-pointer border-2 px-3 py-2 text-sm ${r === x.id ? "border-primary bg-primary/10" : "border-border"}`}>
              <input type="radio" name="relance" value={x.id} checked={r === x.id} onChange={() => setR(x.id)} className="sr-only" />
              <span className="font-bold block">{x.label}</span>
              <span className="text-xs text-muted-foreground">{x.quand}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-bold">{dest.length} destinataire{dest.length > 1 ? "s" : ""}</p>
          <ul className="mt-1 max-h-72 overflow-y-auto border border-input bg-surface divide-y divide-border" aria-label="Destinataires">
            {dest.map((mb) => (
              <li key={mb.email} className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{mb.nom}</span>
                  <span className="block text-xs text-muted-foreground break-all">{mb.email}</span>
                </span>
                <Button asChild size="sm" variant={faits.has(mb.email) ? "secondary" : "outline"} className="shrink-0">
                  <a href={mailtoMembre(mb)} onClick={() => setFaits((f) => new Set(f).add(mb.email))} aria-label={`Écrire à ${mb.nom}`}>
                    {faits.has(mb.email) ? "Ouvert" : "Écrire"}
                  </a>
                </Button>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => copier(adresses, "Les adresses")} disabled={!dest.length}>
            <Copy className="w-4 h-4 mr-1" aria-hidden /> Copier les adresses
          </Button>
        </div>
        <div>
          <p className="text-sm font-bold">Objet : {msg.sujet}</p>
          <textarea readOnly value={msg.corps} rows={6} className="mt-1 w-full border border-input bg-surface p-2 text-sm" aria-label="Texte du message" />
          <Button size="sm" variant="outline" className="mt-2" onClick={() => copier(`${msg.sujet}\n\n${msg.corps}`, "Le message")}>
            <Copy className="w-4 h-4 mr-1" aria-hidden /> Copier le message
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild disabled={!dest.length}>
          <a href={mailto}><Mail className="w-4 h-4 mr-2" aria-hidden /> Ouvrir dans ma messagerie</a>
        </Button>
        <p className="text-xs text-muted-foreground max-w-prose">
          Si votre messagerie ne s'ouvre pas (Gmail dans le navigateur, par exemple), copiez les adresses dans le champ « Cci », puis collez le message.
        </p>
      </div>
    </section>
  );
};

export default RelanceCollective;
