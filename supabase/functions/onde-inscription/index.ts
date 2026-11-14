// Inscription à L'Onde du Sud (formulaire public) puis e-mail de confirmation avec le lien /onde/confirmer.
// La base (onde_inscrire) vérifie l'adresse, le consentement et limite à 5 essais par heure et par adresse ;
// l'e-mail de confirmation part au plus une fois toutes les 10 minutes pour une même adresse, et ne recopie rien de ce qui a été saisi.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { ONDE_EXPEDITEUR, ONDE_REPONSE, SITE, emailConfirmation } from "../_shared/onde-email.ts";
import { resendConfigure, resendEnvoyer } from "../_shared/resend.ts";

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
  const source = body?.source === "evenement" ? "evenement" : body?.source === "onde" ? "onde" : "";
  if (!email || email.length > 255 || !source) return json({ code: "P0001", error: "Adresse e-mail invalide." }, 400);
  if (body?.consentement !== true) return json({ code: "P0001", error: "Cochez la case pour accepter de recevoir L'Onde du Sud." }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin.rpc("onde_inscrire", { _prenom: prenom, _email: email, _consentement: true, _source: source });
  if (error) {
    if (error.code === "P0001") return json({ code: "P0001", error: error.message }, 400);
    console.error("inscription", error.code, error.message);
    return json({ error: "L'inscription n'a pas pu être enregistrée." }, 500);
  }

  // Sans clé Resend : l'inscription est gardée, l'e-mail partira quand la personne renverra le formulaire.
  if (resendConfigure()) {
    const { data } = await admin.rpc("onde_confirmation_a_envoyer", { _email: email });
    const ligne = Array.isArray(data) ? data[0] : null;
    if (ligne?.jeton) {
      const e = emailConfirmation(`${SITE}/onde/confirmer?jeton=${ligne.jeton}`);
      const r = await resendEnvoyer(
        { from: ONDE_EXPEDITEUR, to: [email.toLowerCase()], reply_to: ONDE_REPONSE, subject: e.objet, html: e.html, text: e.texte },
        `onde-confirmation-${ligne.jeton}-${Math.floor(Date.now() / 600_000)}`,
      );
      if (!r.ok) {
        console.error("confirmation non envoyée", r.erreur);
        await admin.from("onde_abonnes").update({ confirmation_envoyee_le: null }).eq("jeton", ligne.jeton);
      }
    }
  }
  // Même réponse dans tous les cas, pour ne jamais révéler si une adresse est déjà abonnée
  return json({ ok: true });
});
