// E-mail de bienvenue à la création d'une fiche (sans cotisation) : une seule fois par personne.
// Appelée par la page d'inscription juste après l'enregistrement. Le serveur ne croit que la base :
// il faut une toute première fiche, créée il y a moins d'une heure, et aucun paiement déjà enregistré.
// Le lien du groupe WhatsApp ne part que dans l'e-mail adressé à la personne, jamais dans la réponse.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { envoyer } from "../_shared/notifications.ts";
import { donneesAccueil } from "../_shared/accueil-donnees.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const RE_MAIL = /^[^\s@()<>,;]+@[^\s@()<>,;]+\.[^\s@()<>,;]{2,}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email || email.length > 255 || !RE_MAIL.test(email)) return json({ error: "Adresse invalide" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // Toutes les fiches de cette adresse doivent dater de moins de 90 minutes, la plus récente de moins d'une heure
  const { data: fiches } = await admin.from("podcasts").select("created_at").eq("email", email).order("created_at", { ascending: true }).limit(20);
  const maintenant = Date.now();
  const dates = (fiches || []).map((f: { created_at: string }) => new Date(f.created_at).getTime());
  if (!dates.length) return json({ sent: false, reason: "sans_fiche" });
  if (maintenant - Math.max(...dates) > 60 * 60_000 || maintenant - Math.min(...dates) > 90 * 60_000) return json({ sent: false, reason: "pas_nouvelle" });
  // Déjà adhérent·e (paiement enregistré ou rattaché) : pas de bienvenue, la personne fait déjà partie du collectif
  const [{ count: paiements }, { count: rattaches }] = await Promise.all([
    admin.from("adhesions").select("id", { count: "exact", head: true }).eq("email", email).in("statut", ["active", "a_verifier"]),
    admin.from("adhesion_rattachements").select("id", { count: "exact", head: true }).eq("email_membre", email),
  ]);
  if ((paiements || 0) > 0 || (rattaches || 0) > 0) return json({ sent: false, reason: "deja_membre" });

  const { data: reserve } = await admin.rpc("accueil_bienvenue_reserver", { _email: email, _motif: "profil" });
  if (!reserve) return json({ sent: false, reason: "deja_envoye" });
  const accueil = await donneesAccueil(admin, email);
  const sent = await envoyer("bienvenue-membre", email, { accueil }, `bienvenue-membre-${email}`, "podcastsdusud@gmail.com");
  if (!sent) await admin.rpc("accueil_bienvenue_annuler", { _email: email });
  return json({ sent });
});
