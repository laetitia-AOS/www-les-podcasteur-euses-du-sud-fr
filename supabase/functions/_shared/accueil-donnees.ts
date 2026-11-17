// Données d'accueil d'une personne, relues en base avec les droits du serveur (jamais envoyées par le navigateur) :
// prénom, département, groupe WhatsApp (ou la règle si le département est inconnu), message de présentation,
// prochain atelier d'écoute et lien « J'ai rejoint le groupe » (jeton à usage unique).
import { SITE_ACCUEIL, dateAtelier, messagePresentation, regleGroupes, type FichePresentation, type GroupeWhatsapp } from "./accueil.ts";

export type DonneesAccueil = {
  prenom: string;
  departement: string | null;
  groupe: { nom: string; lien: string } | null;
  groupes: { nom: string; lien: string }[];
  regle: string;
  presentation: string;
  atelier: { titre: string; date: string; lieu: string; href: string } | null;
  lienRejoint: string;
  lienEspace: string;
  lienStop?: string;
};

// deno-lint-ignore no-explicit-any
type Client = any;

export async function donneesAccueil(admin: Client, email: string, prenomSecours?: string | null, avecStop = false): Promise<DonneesAccueil> {
  const e = email.trim().toLowerCase();
  const [{ data: fiches }, { data: dep }, { data: tous }, { data: atelier }] = await Promise.all([
    admin.from("podcasts")
      .select("prenom, type_profil, metier_principal, city_name, ville, nom_podcast, lien_ecoute, cherche_choix, apporte_choix, cherche_precision, apporte_precision, created_at")
      .eq("email", e).order("created_at", { ascending: true }).limit(20),
    admin.rpc("accueil_departement_de", { _email: e }),
    admin.from("whatsapp_groupes").select("nom, lien, departements, par_defaut, ordre").order("ordre").order("created_at"),
    admin.from("evenements").select("titre, date_debut, lieu, slug")
      .eq("statut", "publie").eq("type", "apero_ecoute").gt("date_debut", new Date().toISOString())
      .order("date_debut", { ascending: true }).limit(1).maybeSingle(),
  ]);
  const groupes = (tous || []) as GroupeWhatsapp[];
  const departement = typeof dep === "string" && dep ? dep : null;
  let groupe: { nom: string; lien: string } | null = null;
  if (departement) {
    const { data: g } = await admin.rpc("accueil_groupe_du_departement", { _dep: departement });
    const r = Array.isArray(g) ? g[0] : g;
    if (r?.lien) groupe = { nom: r.nom, lien: r.lien };
  }
  const { data: jeton } = await admin.rpc("accueil_jeton_creer", { _email: e, _usage: "rejoint" });
  const stop = avecStop ? (await admin.rpc("accueil_jeton_creer", { _email: e, _usage: "stop" })).data : null;
  const f = (fiches || []) as FichePresentation[];
  const prenomBrut = (f.find((x) => (x.prenom || "").trim())?.prenom || prenomSecours || "").trim().split(/\s+/)[0] || "";
  return {
    prenom: prenomBrut ? prenomBrut.charAt(0).toUpperCase() + prenomBrut.slice(1).toLowerCase() : "",
    departement,
    groupe,
    groupes: groupes.map((g) => ({ nom: g.nom, lien: g.lien })),
    regle: regleGroupes(groupes),
    presentation: messagePresentation(f, prenomSecours),
    atelier: atelier ? {
      titre: String(atelier.titre || "Atelier d'écoute"),
      date: dateAtelier(atelier.date_debut),
      lieu: String(atelier.lieu || ""),
      href: `${SITE_ACCUEIL}/agenda/${atelier.slug}`,
    } : null,
    lienRejoint: `${SITE_ACCUEIL}/bienvenue/rejoint?jeton=${encodeURIComponent(String(jeton || ""))}`,
    lienEspace: `${SITE_ACCUEIL}/mon-espace#whatsapp`,
    ...(stop ? { lienStop: `${SITE_ACCUEIL}/bienvenue/relances?jeton=${encodeURIComponent(String(stop))}` } : {}),
  };
}

/** Première cotisation : aucun autre paiement actif ou à vérifier, ni paiement rattaché, pour cette adresse. */
export async function premiereCotisation(admin: Client, email: string, saufId: string): Promise<boolean> {
  const e = email.trim().toLowerCase();
  const [{ count: autres }, { count: rattaches }] = await Promise.all([
    admin.from("adhesions").select("id", { count: "exact", head: true }).eq("email", e).in("statut", ["active", "a_verifier"]).neq("id", saufId),
    admin.from("adhesion_rattachements").select("id", { count: "exact", head: true }).eq("email_membre", e),
  ]);
  return (autres || 0) === 0 && (rattaches || 0) === 0;
}
