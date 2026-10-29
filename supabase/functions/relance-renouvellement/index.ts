// Relance de renouvellement envoyée à UNE personne, par un·e admin (jamais en masse).
// Le serveur relit la liste des membres et vérifie que la personne fait bien partie des destinataires de cette relance.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { envoyer, premierPrenom } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const RELANCES = ["1dec", "20dec", "15jan", "sursis"] as const;
type Relance = (typeof RELANCES)[number];

// deno-lint-ignore no-explicit-any
const concerne = (r: Relance, m: any, y: number) =>
  r === "1dec" || r === "20dec" ? m.etat === "a_jour" && m.annee === y
    : r === "15jan" ? m.annee === y - 1 && m.etat !== "a_jour"
    : m.sursis === true;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token === anon) return json({ error: "Non autorisé" }, 401);
  const { data: u } = await createClient(url, anon).auth.getUser(token);
  if (!u?.user) return json({ error: "Non autorisé" }, 401);
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: estAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  if (!estAdmin) return json({ error: "Réservé aux administrateur·ices" }, 403);

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const relance = String(body?.relance || "") as Relance;
  if (!email || email.length > 255) return json({ error: "Adresse invalide" }, 400);
  if (!RELANCES.includes(relance)) return json({ error: "Relance inconnue" }, 400);

  // Liste des membres lue avec les droits de l'admin connecté·e (même source que la page)
  const enTantQue = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: membres, error } = await enTantQue.rpc("admin_membres");
  if (error) return json({ error: "Liste des membres indisponible" }, 500);
  const y = Number(new Intl.DateTimeFormat("fr-FR", { year: "numeric", timeZone: "Europe/Paris" }).format(new Date()));
  // deno-lint-ignore no-explicit-any
  const m = (membres || []).find((x: any) => (x.email || "").toLowerCase() === email);
  if (m && m.nb_fiches === 0 && m.adhesion_id) {
    const { count: relie } = await admin.from("adhesion_rattachements").select("id", { count: "exact", head: true }).eq("adhesion_id", m.adhesion_id);
    if ((relie || 0) > 0) return json({ error: "Ce paiement est relié à la fiche d'une autre personne : relancez plutôt cette fiche." }, 409);
  }
  if (!m || !concerne(relance, m, y)) return json({ error: "Cette personne n'est pas concernée par cette relance." }, 409);

  const base = relance === "15jan" ? y - 1 : y;
  const cible = relance === "1dec" || relance === "20dec" ? y + 1 : y;
  const code = `renouvellement:${relance}:${cible}`;
  const { count } = await admin.from("relances_profil").select("id", { count: "exact", head: true }).eq("email", email).contains("manques", [code]);
  if ((count || 0) > 0) return json({ error: "Cette relance a déjà été envoyée à cette personne." }, 409);

  const prenom = m.nom && !String(m.nom).includes("@") ? premierPrenom(String(m.nom)) : "";
  const sent = await envoyer("renouvellement", email, { relance, base, cible, prenom, email }, `renouvellement-${relance}-${cible}-${email}`);
  if (!sent) return json({ error: "L'e-mail n'a pas pu partir (adresse refusée ou désinscrite)." }, 502);
  await admin.from("relances_profil").insert({ email, manques: [code], envoye_par: u.user.id });
  return json({ sent: true });
});
