// Inscription à L'Onde du Sud (formulaire public). Pas d'e-mail de confirmation (choix de l'association) :
// la case cochée vaut accord et l'abonnement est actif tout de suite. La base (onde_inscrire) vérifie l'adresse,
// le consentement et limite à 5 essais par heure et par adresse.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const prenom = typeof body?.prenom === "string" ? body.prenom.slice(0, 200) : "";
  const nom = typeof body?.nom === "string" ? body.nom.slice(0, 200) : "";
  const source = body?.source === "evenement" ? "evenement" : body?.source === "onde" ? "onde" : "";
  if (!email || email.length > 255 || !source) return json({ code: "P0001", error: "Adresse e-mail invalide." }, 400);
  if (body?.consentement !== true) return json({ code: "P0001", error: "Cochez la case pour accepter de recevoir L'Onde du Sud." }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin.rpc("onde_inscrire", { _prenom: prenom, _email: email, _consentement: true, _source: source, _nom: nom });
  if (error) {
    if (error.code === "P0001") return json({ code: "P0001", error: error.message }, 400);
    console.error("inscription", error.code, error.message);
    return json({ error: "L'inscription n'a pas pu être enregistrée." }, 500);
  }

  // Même réponse dans tous les cas, pour ne jamais révéler si une adresse est déjà abonnée
  return json({ ok: true });
});
