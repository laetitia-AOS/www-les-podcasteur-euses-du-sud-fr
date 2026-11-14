// L'Onde du Sud : aperçu, test et envoi d'un numéro publié par e-mail (Resend).
// Réservé aux admins et éditeur·ices (rôle relu en base). Un numéro ne part qu'une fois (contrainte en base).
// Les adresses des destinataires ne quittent jamais le serveur, sauf les adresses en erreur, montrées aux seuls admins.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import {
  ONDE_COPIE, ONDE_EXPEDITEUR, ONDE_REPONSE, SITE, emailNumero, objetNumero,
  type ContexteEmail, type MembreEmail, type ModeEmail, type NumeroEmail,
} from "../_shared/onde-email.ts";
import { resendConfigure, resendEnvoyer, resendLot, type MessageResend } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const NON_CONFIGURE = { code: "non_configure", error: "Envoi pas encore configuré" };
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOT = 50;
const PAUSE = 600; // ms entre deux appels : moins de 2 appels par seconde (limite de l'offre Resend)
const DUREE_MAX = 110_000;
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const lienDesinscription = (jeton: string) => `${SITE}/onde/desinscription?jeton=${encodeURIComponent(jeton)}`;
const lienUnClic = (jeton: string) => `${url}/functions/v1/onde-desinscription?jeton=${encodeURIComponent(jeton)}`;
const JETON_TEST = "00000000-0000-0000-0000-000000000000";

// deno-lint-ignore no-explicit-any
type Client = any;

async function contexte(n: NumeroEmail): Promise<ContexteEmail> {
  // Lecture publique : seules les fiches visibles et les événements publiés reviennent, comme sur le site.
  const pub: Client = createClient(url, anonKey);
  const idsEv = [...new Set(n.blocs.flatMap((b) => (b.type === "evenements" ? b.evenements || [] : [])))].filter((i) => RE_UUID.test(i));
  const idsPod = [...new Set(n.blocs.flatMap((b) => (b.type === "podcast" && b.podcast_id ? [b.podcast_id] : [])))].filter((i) => RE_UUID.test(i));
  const [ev, pod] = await Promise.all([
    idsEv.length ? pub.from("evenements").select("id, titre, date_debut, lieu, slug").in("id", idsEv).eq("statut", "publie") : { data: [] },
    idsPod.length ? pub.from("podcasts").select("id, slug, nom_podcast, prenom, nom, type_profil").in("id", idsPod) : { data: [] },
  ]);
  const membres: Record<string, MembreEmail[]> = {};
  for (const b of n.blocs.filter((x) => x.type === "nouveaux_membres")) {
    const { data } = await pub.rpc("onde_nouveaux_membres", { _numero_id: n.id, _bloc_id: b.id });
    membres[b.id] = (data || []) as MembreEmail[];
  }
  return { evenements: ev.data || [], podcasts: pod.data || [], membres };
}

const enTetes = (jeton: string): Record<string, string> => ({
  "List-Unsubscribe": `<${lienUnClic(jeton)}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});

function message(n: NumeroEmail, ctx: ContexteEmail, to: string, mode: ModeEmail, jeton?: string): MessageResend {
  const e = emailNumero(n, ctx, mode);
  return {
    from: ONDE_EXPEDITEUR,
    to: [to],
    reply_to: ONDE_REPONSE,
    subject: e.objet,
    html: e.html,
    text: e.texte,
    ...(mode.type !== "copie" && jeton ? { headers: enTetes(jeton) } : {}),
  };
}

async function empreinte(ids: string[]) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ids.join(",")));
  return [...new Uint8Array(h)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Ligne = { id: string; email: string; prenom: string | null; jeton: string | null; copie: boolean };

/** Envoie les lignes en attente, lot par lot, jusqu'à la fin ou jusqu'à une limite de Resend. */
async function traiter(admin: Client, envoiId: string, n: NumeroEmail, ctx: ContexteEmail) {
  const debut = Date.now();
  let motif: string | null = null;
  while (Date.now() - debut < DUREE_MAX) {
    const { data: lignes, error } = await admin.rpc("onde_envoi_reserver", { _envoi_id: envoiId, _n: LOT });
    if (error) { motif = "Le journal d'envoi n'a pas pu être lu. Réessayez."; console.error("reserver", error.message); break; }
    const ls = (lignes || []) as Ligne[];
    if (!ls.length) break;
    const msgs = ls.map((l) => l.copie ? message(n, ctx, l.email, { type: "copie" }) : message(n, ctx, l.email, { type: "abonne", lienDesinscription: lienDesinscription(l.jeton!) }, l.jeton!));
    const ids = ls.map((l) => l.id);
    const r = await resendLot(msgs, `onde-${envoiId}-${await empreinte(ids)}`);
    if (r.ok) {
      await admin.rpc("onde_envoi_marquer", { _ids: ids, _message_ids: r.ids, _statut: "envoye", _erreur: null });
    } else if (r.quota) {
      await admin.rpc("onde_envoi_marquer", { _ids: ids, _message_ids: null, _statut: "a_envoyer", _erreur: null });
      motif = "Limite d'envoi de l'offre Resend atteinte pour aujourd'hui. Revenez demain et cliquez sur « Reprendre l'envoi » : seules les personnes qui n'ont rien reçu seront servies.";
      break;
    } else if (r.ralentir) {
      await admin.rpc("onde_envoi_marquer", { _ids: ids, _message_ids: null, _statut: "a_envoyer", _erreur: null });
      await attendre(r.attente);
      continue;
    } else if (r.status === 0 || r.status >= 500 || r.status === 401 || r.status === 403) {
      await admin.rpc("onde_envoi_marquer", { _ids: ids, _message_ids: null, _statut: "a_envoyer", _erreur: null });
      motif = r.status === 401 || r.status === 403
        ? "Resend a refusé la clé ou l'expéditeur (domaine pas encore vérifié ?). Rien n'est perdu : corrigez puis cliquez sur « Reprendre l'envoi »."
        : "Resend ne répond pas pour le moment. Rien n'est perdu : cliquez sur « Reprendre l'envoi » dans quelques minutes.";
      console.error("lot refusé", r.erreur);
      break;
    } else {
      // Lot refusé en bloc (une adresse invalide par exemple) : on reprend une par une pour isoler l'erreur.
      for (let k = 0; k < ls.length; k++) {
        await attendre(PAUSE);
        const u = await resendEnvoyer(msgs[k], `onde-${envoiId}-${ls[k].id}`);
        if (u.ok) await admin.rpc("onde_envoi_marquer", { _ids: [ls[k].id], _message_ids: [u.id], _statut: "envoye", _erreur: null });
        else if (u.quota || u.ralentir || u.status === 0 || u.status >= 500) {
          await admin.rpc("onde_envoi_marquer", { _ids: ls.slice(k).map((x) => x.id), _message_ids: null, _statut: "a_envoyer", _erreur: null });
          if (u.ralentir) { await attendre(u.attente); break; }
          motif = u.quota ? "Limite d'envoi de l'offre Resend atteinte pour aujourd'hui. Reprenez l'envoi demain." : "Resend ne répond pas pour le moment. Reprenez l'envoi dans quelques minutes.";
          break;
        } else await admin.rpc("onde_envoi_marquer", { _ids: [ls[k].id], _message_ids: null, _statut: "erreur", _erreur: u.erreur });
      }
      if (motif) break;
    }
    await attendre(PAUSE);
  }
  await admin.rpc("onde_envoi_conclure", { _envoi_id: envoiId, _message: motif || "Envoi en pause : cliquez sur « Reprendre l'envoi » pour finir." });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token === anonKey) return json({ error: "Connectez-vous pour continuer." }, 401);
  const { data: u } = await createClient(url, anonKey).auth.getUser(token);
  if (!u?.user) return json({ error: "Connectez-vous pour continuer." }, 401);
  const admin: Client = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
  const r = new Set(((roles || []) as { role: string }[]).map((x) => x.role));
  if (!r.has("admin") && !r.has("editeur")) return json({ error: "Réservé aux admins et aux éditeur·ices de L'Onde du Sud." }, 403);
  const estAdmin = r.has("admin");

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "");
  const numeroId = String(body?.numero_id || "");
  if (!["etat", "apercu", "test", "envoyer", "reprendre"].includes(action)) return json({ error: "Action inconnue." }, 400);
  if (!RE_UUID.test(numeroId)) return json({ error: "Numéro introuvable." }, 400);

  const { data: n } = await admin.from("onde_numeros")
    .select("id, numero, mois, titre, chapeau, slug, couverture_url, couverture_alt, audio_url, audio_duree, blocs, statut")
    .eq("id", numeroId).maybeSingle();
  if (!n) return json({ error: "Numéro introuvable." }, 404);
  if (n.statut !== "publie") return json({ error: "Publiez d'abord le numéro : seul un numéro publié peut partir par e-mail." }, 409);
  const numero = n as NumeroEmail;

  const bilan = async () => (await admin.rpc("onde_envoi_bilan", { _numero_id: numeroId, _details: estAdmin })).data ?? null;

  if (action === "etat") {
    const { data: nb } = await admin.rpc("onde_destinataires_nombre");
    return json({ configure: resendConfigure(), destinataires: nb ?? 0, envoi: await bilan(), admin: estAdmin, moi: u.user.email || null, copie: ONDE_COPIE });
  }

  const ctx = await contexte(numero);

  if (action === "apercu") {
    const version = body?.version === "copie" ? "copie" : "abonne";
    const e = emailNumero(numero, ctx, version === "copie" ? { type: "copie" } : { type: "abonne", lienDesinscription: lienDesinscription(JETON_TEST) });
    return json({ ...e, expediteur: ONDE_EXPEDITEUR, reponse: ONDE_REPONSE });
  }

  if (!resendConfigure()) return json(NON_CONFIGURE, 409);

  if (action === "test") {
    const moi = (u.user.email || "").trim().toLowerCase();
    if (!moi) return json({ error: "Votre compte n'a pas d'adresse e-mail." }, 400);
    const m = message(numero, ctx, moi, { type: "test", lienDesinscription: lienDesinscription(JETON_TEST) }, JETON_TEST);
    const minute = Math.floor(Date.now() / 60_000);
    const res = await resendEnvoyer(m, `onde-test-${numeroId}-${u.user.id}-${minute}`);
    if (!res.ok) {
      console.error("test refusé", res.erreur);
      return json({ error: res.quota ? "Limite d'envoi de l'offre Resend atteinte pour aujourd'hui." : res.status === 401 || res.status === 403 ? "Resend a refusé l'envoi : clé ou domaine pas encore vérifié." : "Le test n'est pas parti. Réessayez dans un instant.", details: res.erreur }, 502);
    }
    return json({ ok: true, a: moi });
  }

  if (action === "envoyer") {
    const attendu = Number(body?.attendu);
    if (!Number.isInteger(attendu) || attendu < 1) return json({ error: "Nombre de destinataires manquant." }, 400);
    const { data: envoiId, error } = await admin.rpc("onde_envoi_demarrer", {
      _numero_id: numeroId, _lance_par: u.user.id, _objet: objetNumero(numero), _attendu: attendu, _copie: ONDE_COPIE,
    });
    if (error) {
      if (error.code === "23505") return json({ error: "Ce numéro a déjà été envoyé : un numéro ne part qu'une fois." }, 409);
      if (error.code === "P0001") return json({ error: error.message, code: error.hint === "liste_changee" ? "liste_changee" : undefined }, 409);
      console.error("demarrer", error.message);
      return json({ error: "L'envoi n'a pas pu démarrer. Réessayez." }, 500);
    }
    await traiter(admin, envoiId as string, numero, ctx);
    return json({ ok: true, envoi: await bilan() });
  }

  // reprendre
  const b = await bilan();
  if (!b) return json({ error: "Ce numéro n'a pas encore été envoyé." }, 409);
  if (b.statut === "termine") return json({ error: "Cet envoi est déjà terminé." }, 409);
  await traiter(admin, b.id, numero, ctx);
  return json({ ok: true, envoi: await bilan() });
});
