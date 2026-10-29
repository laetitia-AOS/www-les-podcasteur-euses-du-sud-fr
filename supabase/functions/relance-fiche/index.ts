// Relance d'un·e adhérent·e de l'année qui n'a pas encore de fiche (réservé aux admins).
// La page n'envoie que l'adresse ; le serveur vérifie en base le paiement et l'absence de fiche.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { envoyer, premierPrenom } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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
  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "Adresse invalide" }, 400);

  const annee = Number(new Intl.DateTimeFormat("fr-FR", { year: "numeric", timeZone: "Europe/Paris" }).format(new Date()));
  const { data: paiements } = await admin.from("adhesions").select("id, email, prenom, annee, statut")
    .in("statut", ["active", "a_verifier"]).gte("annee", annee - 1);
  const siens = (paiements || []).filter((p) => (p.email || "").trim().toLowerCase() === email);
  if (!siens.length) return json({ error: "Aucune adhésion récente avec cette adresse." }, 404);

  const { data: fiches } = await admin.from("podcasts").select("email");
  if ((fiches || []).some((f) => (f.email || "").trim().toLowerCase() === email)) return json({ error: "Cette personne a déjà une fiche." }, 409);
  const { count: relie } = await admin.from("adhesion_rattachements").select("id", { count: "exact", head: true }).in("adhesion_id", siens.map((p) => p.id));
  if ((relie || 0) > 0) return json({ error: "Ce paiement est déjà relié à une fiche." }, 409);

  const depuis = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await admin.from("relances_profil").select("id", { count: "exact", head: true }).eq("email", email).gte("envoye_le", depuis);
  if ((count || 0) > 0) return json({ error: "Cette personne a déjà été relancée ces dernières 24 heures." }, 429);

  const p = siens.sort((a, b) => (b.annee || 0) - (a.annee || 0))[0];
  const jour = new Date().toISOString().slice(0, 10);
  const sent = await envoyer("fiche-a-creer", email, { prenom: premierPrenom(p.prenom), annee: p.annee || annee, email }, `fiche-a-creer-${email}-${jour}`);
  if (!sent) return json({ error: "L'e-mail n'a pas pu partir (adresse refusée ou désinscrite)." }, 502);
  await admin.from("relances_profil").insert({ email, manques: ["fiche"], envoye_par: u.user.id });
  return json({ sent: true });
});
