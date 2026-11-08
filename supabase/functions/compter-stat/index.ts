// Compte une vue de fiche ou une écoute lancée depuis le site.
// Aucun cookie, aucune adresse IP conservée : seulement une empreinte brouillée (sel secret + jour), effacée sous 48 h.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE = /^\/[a-z0-9/-]{0,120}$/;
const PROVENANCES = ["direct", "google", "bing", "autre-moteur", "linkedin", "facebook", "instagram", "whatsapp", "x", "autre-site"];
const ROBOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|python|curl|wget/i;

const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 500) return json({ error: "Too large" }, 413);
    const body = JSON.parse(raw || "{}");
    const type = String(body?.type || "");

    const sel = Deno.env.get("STATS_SEL");
    if (!sel) return json({ error: "Not configured" }, 503);
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "";
    if (!ip) return json({ counted: false });
    const jour = new Date().toISOString().slice(0, 10);
    const empreinte = await sha256(`${sel}|${jour}|${ip}`);
    const url = Deno.env.get("SUPABASE_URL")!;

    // Visite d'une page publique du site (rapport de la semaine)
    if (type === "visite") {
      const page = String(body?.page || "");
      const provenance = String(body?.provenance || "direct");
      if (!PAGE.test(page) || !PROVENANCES.includes(provenance)) return json({ error: "Invalid input" }, 400);
      if (ROBOT.test(req.headers.get("user-agent") || "")) return json({ counted: false });
      const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data, error } = await admin.rpc("compter_visite", { _empreinte: empreinte, _page: page, _provenance: provenance });
      if (error) {
        console.error("compter_visite:", error.message);
        return json({ counted: false }, 500);
      }
      return json({ counted: !!data });
    }

    const podcastId = String(body?.podcast_id || "");
    if (!UUID.test(podcastId) || !["vue", "ecoute"].includes(type)) return json({ error: "Invalid input" }, 400);
    // Membre connecté : sa propre fiche n'est pas comptée
    let emailVisiteur: string | null = null;
    const auth = req.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (token && token !== anon) {
      const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
      const { data } = await userClient.auth.getUser(token);
      emailVisiteur = data?.user?.email ?? null;
    }

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await admin.rpc("compter_stat", {
      _podcast_id: podcastId, _type: type, _empreinte: empreinte, _email_visiteur: emailVisiteur,
    });
    if (error) {
      console.error("compter_stat:", error.message);
      return json({ counted: false }, 500);
    }
    return json({ counted: !!data });
  } catch {
    return json({ error: "Invalid input" }, 400);
  }
});
