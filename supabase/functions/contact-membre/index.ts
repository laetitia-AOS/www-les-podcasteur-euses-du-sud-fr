// Edge Function : transmet un message d'un·e visiteur·ice à un membre, sans jamais révéler l'e-mail du membre.
// Le message est enregistré dans contact_requests puis envoyé au membre via Brevo (réponse directe à l'expéditeur·ice).

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.les-podcasteur-euses-du-sud.fr";
const SENDER_EMAIL = "podcastsdusud@gmail.com";
const SENDER_NAME = "Les Podcasteur·euses du Sud";
const MAX_PER_HOUR = 5;

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const { recipient_id, sender_name, sender_email, message } = await req.json();
    const name = String(sender_name || "").trim();
    const email = String(sender_email || "").trim().toLowerCase();
    const msg = String(message || "").trim();

    if (!recipient_id || !/^[0-9a-f-]{36}$/i.test(recipient_id)) return json({ error: "Destinataire invalide" }, 400);
    if (name.length < 2 || name.length > 100) return json({ error: "Indiquez votre nom (2 à 100 caractères)." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 255) return json({ error: "Adresse e-mail invalide." }, 400);
    if (msg.length < 10 || msg.length > 3000) return json({ error: "Votre message doit faire entre 10 et 3 000 caractères." }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: recipient } = await admin
      .from("podcasts")
      .select("id, email, prenom, nom_podcast, valide, consent_contact")
      .eq("id", recipient_id)
      .maybeSingle();
    if (!recipient || !recipient.valide || !recipient.consent_contact || !recipient.email) {
      return json({ error: "Ce membre ne peut pas recevoir de message pour le moment." }, 400);
    }

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("contact_requests")
      .select("id", { count: "exact", head: true })
      .eq("sender_email", email)
      .gte("created_at", since);
    if ((count || 0) >= MAX_PER_HOUR) {
      return json({ error: "Vous avez envoyé beaucoup de messages en peu de temps. Réessayez dans une heure." }, 429);
    }

    const { error: insertError } = await admin.from("contact_requests").insert({
      recipient_id,
      sender_name: name,
      sender_email: email,
      message: msg,
    });
    if (insertError) return json({ error: "Le message n'a pas pu être enregistré." }, 500);

    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) return json({ error: "L'envoi d'e-mails n'est pas configuré." }, 500);

    const html = `
      <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#0F0F12;max-width:560px">
        <p>Bonjour ${esc(recipient.prenom || "")},</p>
        <p><strong>${esc(name)}</strong> vous a écrit depuis votre fiche${recipient.nom_podcast ? ` « ${esc(recipient.nom_podcast)} »` : ""} sur Les Podcasteur·euses du Sud :</p>
        <blockquote style="margin:16px 0;padding:12px 16px;border-left:4px solid #1530B8;background:#F3F2EE;white-space:pre-wrap">${esc(msg)}</blockquote>
        <p>Pour répondre, répondez simplement à cet e-mail : votre réponse partira vers ${esc(email)}.</p>
        <p style="font-size:13px;color:#55555C">Votre adresse n'a pas été communiquée à cette personne. — <a href="${SITE_URL}" style="color:#1530B8">les-podcasteur-euses-du-sud.fr</a></p>
      </div>`;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to: [{ email: recipient.email }],
        replyTo: { email, name },
        subject: `Nouveau message de ${name} via Les Podcasteur·euses du Sud`,
        htmlContent: html,
      }),
    });
    if (!res.ok) return json({ error: "Le message est enregistré mais l'e-mail n'a pas pu partir. L'équipe le transmettra." }, 502);

    return json({ ok: true });
  } catch (_e) {
    return json({ error: "Une erreur est survenue. Réessayez dans un instant." }, 500);
  }
});
