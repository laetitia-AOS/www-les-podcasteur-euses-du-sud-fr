// Confirme par e-mail un « Je viens » qui vient d'être enregistré.
// N'envoie qu'à l'adresse d'une venue réelle enregistrée il y a moins de 15 minutes, une seule fois par venue.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { dateLongue, envoyer, premierPrenom } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  const body = await req.json().catch(() => ({}));
  const evenementId = String(body?.evenement_id || "");
  const email = String(body?.email || "").trim().toLowerCase();
  if (!UUID.test(evenementId) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 255) return json({ error: "Données invalides" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: v } = await admin.from("evenement_inscriptions")
    .select("id, prenom, created_at")
    .eq("evenement_id", evenementId).ilike("email", email)
    .gte("created_at", new Date(Date.now() - 15 * 60_000).toISOString())
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!v) return json({ sent: false });
  const { data: e } = await admin.from("evenements").select("titre, slug, date_debut, lieu, format, statut").eq("id", evenementId).maybeSingle();
  if (!e || e.statut !== "publie") return json({ sent: false });
  const sent = await envoyer("venue-confirmee", email, {
    prenom: premierPrenom(v.prenom), titre: e.titre, date: dateLongue(e.date_debut), lieu: e.lieu || undefined, slug: e.slug, enLigne: e.format === "en_ligne",
  }, `venue-confirmee-${v.id}`);
  return json({ sent });
});
