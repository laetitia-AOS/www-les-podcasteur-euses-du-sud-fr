// Groupes WhatsApp : relance unique à J+7 et invitation de rattrapage des membres, par Resend.
// - « etat », « apercu », « lancer » : admins seulement (rôle relu en base). Rien ne part sans le clic « lancer ».
// - « quotidien » : appelé chaque jour (9 h 23, heure de Paris en hiver) par la tâche planifiée, seule autorisée ; envoie les relances dues (une seule par personne)
//   et reprend l'invitation en cours si la limite du jour de Resend avait été atteinte la veille.
// - POST ?stop=<jeton> : désinscription en un clic des relances (en-tête List-Unsubscribe-Post).
// Les liens des groupes ne sortent que dans l'e-mail adressé à la personne, ou vers un·e admin.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { resendConfigure, resendEnvoyer } from "../_shared/resend.ts";
import { donneesAccueil, type DonneesAccueil } from "../_shared/accueil-donnees.ts";
import { ACCUEIL_EXPEDITEUR, ACCUEIL_REPONSE, emailAccueil, type TypeAccueil } from "../_shared/accueil-email.ts";
import { SITE_ACCUEIL, regleGroupes, type GroupeWhatsapp } from "../_shared/accueil.ts";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const NON_CONFIGURE = { code: "non_configure", error: "Envoi pas encore configuré" };
const PAUSE = 600;
const DUREE_MAX = 100_000;
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));
const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
// deno-lint-ignore no-explicit-any
type Client = any;

async function prenomPaiement(admin: Client, email: string): Promise<string | null> {
  const { data } = await admin.from("adhesions").select("prenom").eq("email", email).not("prenom", "is", null).order("date_adhesion", { ascending: false }).limit(1);
  return data?.[0]?.prenom ?? null;
}

type Resultat = { envoyes: number; erreurs: number; quota: boolean };

async function envoyerUn(admin: Client, email: string, type: TypeAccueil): Promise<"ok" | "erreur" | "quota"> {
  const d = await donneesAccueil(admin, email, await prenomPaiement(admin, email), true);
  const e = emailAccueil(d, type);
  const stop = d.lienStop ? new URL(d.lienStop).searchParams.get("jeton") : null;
  for (let essai = 0; essai < 3; essai++) {
    const r = await resendEnvoyer({
      from: ACCUEIL_EXPEDITEUR, to: [email], reply_to: ACCUEIL_REPONSE, subject: e.objet, html: e.html, text: e.texte,
      ...(stop ? { headers: { "List-Unsubscribe": `<${url}/functions/v1/accueil-whatsapp?stop=${stop}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
    }, `accueil-${type}-${email}`);
    if (r.ok) return "ok";
    if (r.quota) return "quota";
    if (r.ralentir) { await attendre(r.attente); continue; }
    console.error(`accueil ${type} :`, r.erreur);
    return "erreur";
  }
  return "erreur";
}

async function relances(admin: Client, debut: number): Promise<Resultat> {
  const res: Resultat = { envoyes: 0, erreurs: 0, quota: false };
  const { data } = await admin.rpc("accueil_relances_dues");
  for (const { email } of (data || []) as { email: string }[]) {
    if (Date.now() - debut > DUREE_MAX) break;
    const r = await envoyerUn(admin, email, "relance");
    if (r === "quota") { res.quota = true; break; }
    // Une seule relance par personne, même en cas d'adresse refusée
    await admin.rpc("accueil_marquer", { _email: email, _quoi: "relance" });
    if (r === "ok") res.envoyes++; else res.erreurs++;
    await attendre(PAUSE);
  }
  return res;
}

async function invitations(admin: Client, debut: number) {
  const { data: enCours } = await admin.from("accueil_invitations").select("id, envoyes, erreurs").is("terminee_le", null).maybeSingle();
  if (!enCours) return null;
  const res: Resultat = { envoyes: 0, erreurs: 0, quota: false };
  const { data } = await admin.rpc("accueil_invitation_cibles");
  const cibles = ((data || []) as { email: string }[]).map((x) => x.email);
  let i = 0;
  for (; i < cibles.length; i++) {
    if (Date.now() - debut > DUREE_MAX) break;
    const r = await envoyerUn(admin, cibles[i], "invitation");
    if (r === "quota") { res.quota = true; break; }
    await admin.rpc("accueil_marquer", { _email: cibles[i], _quoi: "invitation" });
    if (r === "ok") res.envoyes++; else res.erreurs++;
    await attendre(PAUSE);
  }
  const fini = i >= cibles.length;
  const restants = cibles.length - i;
  const message = fini ? "Envoi terminé." : res.quota
    ? `Limite d'envoi du jour atteinte : ${restants} personne${restants > 1 ? "s" : ""} recevront l'invitation demain, automatiquement.`
    : `${restants} personne${restants > 1 ? "s" : ""} encore à servir : l'envoi continue au prochain passage.`;
  await admin.from("accueil_invitations").update({
    envoyes: enCours.envoyes + res.envoyes, erreurs: enCours.erreurs + res.erreurs, message,
    ...(fini ? { terminee_le: new Date().toISOString() } : {}),
  }).eq("id", enCours.id);
  return { ...res, restants, fini, message };
}

async function apercu(admin: Client, variante: "connu" | "inconnu", type: TypeAccueil) {
  const { data: tous } = await admin.from("whatsapp_groupes").select("nom, lien, departements, par_defaut, ordre").order("ordre");
  const groupes = (tous || []) as GroupeWhatsapp[];
  const defaut = groupes.find((g) => g.par_defaut) || groupes[0];
  const d: DonneesAccueil = {
    prenom: "Alix",
    departement: variante === "connu" ? "13" : null,
    groupe: variante === "connu" && defaut ? { nom: defaut.nom, lien: defaut.lien } : null,
    groupes: groupes.map((g) => ({ nom: g.nom, lien: g.lien })),
    regle: regleGroupes(groupes),
    presentation: "Bonjour à toutes et à tous ! Je suis Alix, [ce que je fais] à Marseille. Mon projet : [nom du podcast + lien]. Je cherche : montage. Je peux apporter : voix off. Ravi·e de vous rejoindre !",
    atelier: null,
    lienRejoint: `${SITE_ACCUEIL}/bienvenue/rejoint?jeton=apercu`,
    lienEspace: `${SITE_ACCUEIL}/mon-espace#whatsapp`,
    lienStop: `${SITE_ACCUEIL}/bienvenue/relances?jeton=apercu`,
  };
  const { data: atelier } = await admin.from("evenements").select("titre, date_debut, lieu, slug").eq("statut", "publie").eq("type", "apero_ecoute")
    .gt("date_debut", new Date().toISOString()).order("date_debut").limit(1).maybeSingle();
  if (atelier) {
    const { dateAtelier } = await import("../_shared/accueil.ts");
    d.atelier = { titre: atelier.titre, date: dateAtelier(atelier.date_debut), lieu: atelier.lieu || "", href: `${SITE_ACCUEIL}/agenda/${atelier.slug}` };
  }
  return emailAccueil(d, type);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const stop = new URL(req.url).searchParams.get("stop");
  if (stop) {
    if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
    const { data } = await admin.rpc("accueil_jeton_utiliser", { _jeton: stop });
    return json({ ok: data === "stop" || data === "deja" });
  }
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "");
  const debut = Date.now();

  if (action === "quotidien") {
    // Seule la tâche planifiée (secret géré par la plateforme) peut lancer le passage du jour
    const refus = authenticateCronRequest(req);
    if (refus) return refus;
    if (!resendConfigure()) return json({ configure: false });
    const r = await relances(admin, debut);
    const inv = r.quota ? null : await invitations(admin, debut);
    return json({ configure: true, relances: r, invitation: inv });
  }

  // Actions de l'équipe : admins seulement
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token === anonKey) return json({ error: "Non autorisé" }, 401);
  const { data: u } = await createClient(url, anonKey).auth.getUser(token);
  if (!u?.user) return json({ error: "Non autorisé" }, 401);
  const { data: estAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  if (!estAdmin) return json({ error: "Réservé aux administrateur·ices" }, 403);

  if (action === "etat") {
    const [{ data: cibles }, { data: derniere }] = await Promise.all([
      admin.rpc("accueil_invitation_cibles"),
      admin.from("accueil_invitations").select("lancee_le, terminee_le, envoyes, erreurs, message").order("lancee_le", { ascending: false }).limit(1).maybeSingle(),
    ]);
    return json({ configure: resendConfigure(), nombre: (cibles || []).length, derniere: derniere || null });
  }
  if (action === "apercu") {
    const e = await apercu(admin, body?.variante === "inconnu" ? "inconnu" : "connu", body?.type === "relance" ? "relance" : "invitation");
    return json({ objet: e.objet, html: e.html });
  }
  if (action === "lancer") {
    if (!resendConfigure()) return json(NON_CONFIGURE, 200);
    const { data: enCours } = await admin.from("accueil_invitations").select("id").is("terminee_le", null).maybeSingle();
    if (!enCours) {
      const { data: cibles } = await admin.rpc("accueil_invitation_cibles");
      if (!(cibles || []).length) return json({ error: "Personne à inviter pour l'instant." }, 409);
      const { error } = await admin.from("accueil_invitations").insert({ lancee_par: u.user.id });
      if (error) return json({ error: "Un envoi est déjà en cours." }, 409);
    }
    const inv = await invitations(admin, debut);
    return json({ ok: true, ...inv });
  }
  return json({ error: "Action inconnue" }, 400);
});
