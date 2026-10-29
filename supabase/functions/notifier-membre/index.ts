// Prévient un membre par e-mail après une décision de l'équipe (réservé aux admins) :
// adhésion validée à la main, ou proposition d'événement publiée / refusée.
// Le serveur relit tout en base : la page n'envoie qu'un identifiant.
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
  const id = String(body?.id || "");
  if (!UUID.test(id)) return json({ error: "Identifiant invalide" }, 400);

  if (body?.type === "adhesion") {
    const { data: a } = await admin.from("adhesions").select("id, email, prenom, statut, annee, formule, montant").eq("id", id).maybeSingle();
    if (!a || a.statut !== "active") return json({ sent: false, reason: "adhesion_inactive" });
    const sent = await envoyer("adhesion-confirmee", a.email, {
      prenom: premierPrenom(a.prenom), annee: a.annee, formule: a.formule, montant: a.montant,
    }, `adhesion-confirmee-${a.id}`);
    return json({ sent });
  }

  if (body?.type === "proposition") {
    const { data: e } = await admin.from("evenements").select("id, titre, slug, date_debut, statut, motif_refus, updated_at, origine").eq("id", id).maybeSingle();
    if (!e || e.origine !== "membre" || !["publie", "refuse"].includes(e.statut)) return json({ sent: false, reason: "rien_a_envoyer" });
    const { data: p } = await admin.from("evenements_proposeurs").select("email, podcast_id").eq("evenement_id", id).maybeSingle();
    if (!p?.email) return json({ sent: false, reason: "sans_auteur" });
    const { data: f } = p.podcast_id ? await admin.from("podcasts").select("prenom").eq("id", p.podcast_id).maybeSingle() : { data: null };
    const prenom = premierPrenom(f?.prenom);
    const cle = `proposition-${e.statut}-${e.id}-${new Date(e.updated_at || Date.now()).getTime()}`;
    const sent = e.statut === "publie"
      ? await envoyer("proposition-publiee", p.email, { prenom, titre: e.titre, date: dateLongue(e.date_debut), slug: e.slug }, cle)
      : await envoyer("proposition-refusee", p.email, { prenom, titre: e.titre, motif: e.motif_refus || undefined }, cle);
    return json({ sent });
  }
  return json({ error: "Type inconnu" }, 400);
});
