// Edge function : envoie un email de confirmation d'inscription à un événement via Brevo
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  email: string;
  prenom: string;
  nom: string;
  titre: string;
  date_debut: string;
  lieu?: string | null;
  adresse?: string | null;
  slug?: string | null;
}

const SITE_URL = "https://www.les-podcasteur-euses-du-sud.fr";
const SENDER_EMAIL = "podcastsdusud@gmail.com";
const SENDER_NAME = "Les Podcasteur·euses du Sud";

function esc(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateFr(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} à ${time}`;
  } catch {
    return iso;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      return new Response(
        JSON.stringify({ error: "BREVO_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Payload;
    const { email, prenom, nom, titre, date_debut, lieu, adresse, slug } = body;

    if (!email || !prenom || !nom || !titre || !date_debut) {
      return new Response(
        JSON.stringify({ error: "Champs requis manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const eventUrl = slug ? `${SITE_URL}/evenement-podcast/${slug}` : SITE_URL;
    const dateStr = formatDateFr(date_debut);
    const lieuLine = lieu
      ? `<tr><td style="padding:6px 0;color:#6b6b6b;font-size:14px;">📍 ${esc(lieu)}${adresse ? " — " + esc(adresse) : ""}</td></tr>`
      : "";

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Inscription confirmée</title></head>
<body style="margin:0;padding:0;background:#F6F1E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1E8;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FDFAF5;border-radius:16px;overflow:hidden;border:1px solid #eadfc9;">
        <tr><td style="background:#1e3a5f;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Inscription confirmée ✓</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;">Bonjour ${esc(prenom)},</p>
          <p style="margin:0 0 20px;color:#3a3a3a;font-size:15px;line-height:1.6;">
            Nous confirmons votre inscription à l'événement&nbsp;:
          </p>
          <div style="background:#F6F1E8;border-radius:12px;padding:18px 20px;margin:0 0 20px;">
            <h2 style="margin:0 0 10px;color:#1e3a5f;font-size:18px;font-weight:700;">${esc(titre)}</h2>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;color:#6b6b6b;font-size:14px;">🗓️ ${esc(dateStr)}</td></tr>
              ${lieuLine}
            </table>
          </div>
          <p style="margin:0 0 24px;color:#3a3a3a;font-size:15px;line-height:1.6;">
            Nous avons hâte de vous retrouver ! Vous recevrez d'éventuelles informations complémentaires à cette adresse email.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${esc(eventUrl)}" style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:14px;">
              Voir l'événement
            </a>
          </p>
          <p style="margin:0;color:#8a8a8a;font-size:13px;line-height:1.5;">
            À bientôt,<br>
            L'équipe des Podcasteur·euses du Sud
          </p>
        </td></tr>
        <tr><td style="background:#F6F1E8;padding:18px 32px;text-align:center;border-top:1px solid #eadfc9;">
          <p style="margin:0;color:#8a8a8a;font-size:12px;">
            <a href="${SITE_URL}" style="color:#1e3a5f;text-decoration:none;">les-podcasteur-euses-du-sud.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to: [{ email, name: `${prenom} ${nom}`.trim() }],
        subject: `Inscription confirmée : ${titre}`,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Brevo error", res.status, errText);
      return new Response(
        JSON.stringify({ error: "Brevo API error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unexpected error", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
