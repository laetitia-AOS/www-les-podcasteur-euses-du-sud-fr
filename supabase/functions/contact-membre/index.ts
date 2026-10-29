// Edge Function : transmet un message d'un·e visiteur·ice à un membre, sans jamais révéler l'e-mail du membre.
// Le message est enregistré dans contact_requests ; l'équipe le transmet ensuite au membre depuis l'admin.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_RECIPIENTS = 40;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { recipient_id, recipient_ids, sender_name, sender_email, message } = body ?? {};
    // Les devis passent par la fonction « demande-devis »
    const type = ["collab", "message"].includes(body?.type) ? String(body.type) : "message";
    const maxLen = type === "collab" ? 1000 : 3000;
    const name = String(sender_name || "").trim();
    const email = String(sender_email || "").trim().toLowerCase();
    const msg = String(message || "").trim();

    // Un message (un·e destinataire) ou un devis (plusieurs studios)
    const ids: string[] = Array.isArray(recipient_ids) ? recipient_ids.map(String) : recipient_id ? [String(recipient_id)] : [];
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length || uniqueIds.length > MAX_RECIPIENTS || !uniqueIds.every((id) => UUID.test(id))) {
      return json({ error: "Destinataire invalide" }, 400);
    }
    if (name.length < 2 || name.length > 100) return json({ error: "Indiquez votre nom (2 à 100 caractères)." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 255) return json({ error: "Adresse e-mail invalide." }, 400);
    if (msg.length < 10 || msg.length > maxLen) {
      return json({ error: `Votre message doit faire entre 10 et ${maxLen === 1000 ? "1 000" : "3 000"} caractères.` }, 400);
    }
    if (type === "collab" && uniqueIds.length > 1) return json({ error: "Une proposition de collab s'adresse à un seul membre." }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: found } = await admin
      .from("podcasts")
      .select("id, valide, consent_contact")
      .in("id", uniqueIds);
    // Seules les fiches visibles sur le site (validées + adhésion à jour) reçoivent des messages
    const visibles = await Promise.all((found || []).map(async (r) => {
      if (!r.valide || !r.consent_contact) return null;
      const { data: ok } = await admin.rpc("podcast_visible", { _id: r.id });
      return ok ? r : null;
    }));
    const recipients = visibles.filter((r): r is NonNullable<typeof r> => !!r);
    if (!recipients.length) {
      return json({ error: "Ce membre ne peut pas recevoir de message pour le moment." }, 400);
    }

    // Un seul enregistrement groupé : un devis envoyé à plusieurs studios compte pour un envoi.
    // La base vérifie et nettoie chaque champ, et limite à 5 envois par heure et par adresse.
    // Aucun service d'envoi externe : l'équipe transmet le message au membre depuis l'admin.
    const { error: insertError } = await admin.from("contact_requests").insert(
      recipients.map((r) => ({ recipient_id: r.id, sender_name: name, sender_email: email, message: msg, type })),
    );
    if (insertError) {
      if (insertError.code === "P0001") {
        return json({ error: insertError.message }, insertError.hint === "rate_limit" ? 429 : 400);
      }
      return json({ error: "Le message n'a pas pu être enregistré." }, 500);
    }
    return json({ ok: true, emailed: false, count: recipients.length });
  } catch (_e) {
    return json({ error: "Une erreur est survenue. Réessayez dans un instant." }, 500);
  }
});
