// Confirmation de paiement (« adhesion-confirmee ») : la même pour tout le monde ; à la toute première
// cotisation d'une personne qui n'a pas encore reçu la bienvenue, elle est enrichie de l'accueil
// (groupe WhatsApp, message de présentation…). Jamais deux bienvenues à la même personne.
import { envoyer, premierPrenom } from "./notifications.ts";
import { donneesAccueil, premiereCotisation } from "./accueil-donnees.ts";

// deno-lint-ignore no-explicit-any
type Client = any;
type Adhesion = { id: string; email: string; prenom: string | null; annee: number | null; formule: string | null; montant: number | null };

export async function envoyerConfirmationAdhesion(admin: Client, a: Adhesion): Promise<boolean> {
  const email = a.email.trim().toLowerCase();
  const data: Record<string, unknown> = { prenom: premierPrenom(a.prenom), annee: a.annee, formule: a.formule, montant: a.montant };
  let reserve = false;
  try {
    if (await premiereCotisation(admin, email, a.id)) {
      const { data: ok } = await admin.rpc("accueil_bienvenue_reserver", { _email: email, _motif: "cotisation" });
      reserve = ok === true;
      if (reserve) data.accueil = await donneesAccueil(admin, email, a.prenom);
    }
  } catch (e) {
    console.error("accueil :", e instanceof Error ? e.message.slice(0, 200) : "inconnu");
  }
  const sent = await envoyer("adhesion-confirmee", email, data, `adhesion-confirmee-${a.id}`, "podcastsdusud@gmail.com");
  if (!sent && reserve) await admin.rpc("accueil_bienvenue_annuler", { _email: email });
  return sent;
}
