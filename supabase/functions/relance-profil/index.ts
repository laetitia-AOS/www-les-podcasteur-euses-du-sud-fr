// Relance individuelle d'un·e membre dont la fiche est incomplète (réservé aux admins).
// La page n'envoie que l'adresse de la fiche et les cases cochées ; le serveur relit la fiche en base.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { envoyer, premierPrenom } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const MANQUES = ["photo", "pochette", "rss", "collab"];

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
  const manques = Array.isArray(body?.manques) ? MANQUES.filter((m) => body.manques.includes(m)) : [];
  if (!email || email.length > 255) return json({ error: "Adresse invalide" }, 400);
  if (!manques.length) return json({ error: "Cochez au moins un élément à compléter." }, 400);

  const { data: fiches } = await admin.from("podcasts")
    .select("prenom, nom_podcast, type_profil, vignette_url, flux_rss, email").ilike("email", email.replace(/[%_\\]/g, "\\$&"));
  const siennes = (fiches || []).filter((f) => (f.email || "").trim().toLowerCase() === email);
  if (!siennes.length) return json({ error: "Aucune fiche avec cette adresse." }, 404);

  const depuis = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await admin.from("relances_profil").select("id", { count: "exact", head: true }).eq("email", email).gte("envoye_le", depuis);
  if ((count || 0) > 0) return json({ error: "Cette personne a déjà été relancée ces dernières 24 heures." }, 429);

  const podcasts = siennes.filter((f) => f.type_profil === "podcasteur");
  const data = {
    prenom: premierPrenom(siennes.find((f) => f.prenom)?.prenom),
    manques,
    podcastsSansPochette: podcasts.filter((f) => !f.vignette_url).map((f) => f.nom_podcast).slice(0, 5),
    podcastsSansRss: podcasts.filter((f) => !f.flux_rss).map((f) => f.nom_podcast).slice(0, 5),
  };
  const jour = new Date().toISOString().slice(0, 10);
  const sent = await envoyer("profil-a-completer", email, data, `profil-a-completer-${email}-${jour}`);
  if (!sent) return json({ error: "L'e-mail n'a pas pu partir (adresse refusée ou désinscrite)." }, 502);
  await admin.from("relances_profil").insert({ email, manques, envoye_par: u.user.id });
  return json({ sent: true });
});
