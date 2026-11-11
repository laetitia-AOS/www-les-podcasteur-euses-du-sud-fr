// Edge Function : enregistre un avis (note + commentaire) sous la fiche d'un podcast,
// ou signale un avis déjà publié pour qu'un·e admin le regarde.
// La base (déclencheur `guard_avis`) vérifie, nettoie et limite les envois ; ici on ne fait
// qu'appeler l'insertion avec un accès serveur, jamais depuis le navigateur.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Motifs de signalement : une liste fermée, jamais de texte libre.
const MOTIFS = ["spam", "offensant", "hors sujet", "pas mon podcast"] as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ---------- Signalement d'un avis déjà publié ----------
    if (body?.action === "signaler") {
      const avisId = String(body?.avis_id || "");
      const motif = String(body?.motif || "");
      if (!UUID.test(avisId)) return json({ error: "Avis introuvable." }, 400);
      if (!MOTIFS.includes(motif as (typeof MOTIFS)[number])) return json({ error: "Motif de signalement invalide." }, 400);

      const { error } = await admin
        .from("avis")
        .update({ signale: true, motif_signalement: motif })
        .eq("id", avisId)
        .eq("statut", "publie")
        .eq("signale", false);
      if (error) return json({ error: "Le signalement n'a pas pu être transmis. Réessayez dans un instant." }, 500);
      return json({ ok: true });
    }

    // ---------- Nouvel avis ----------
    const podcastId = String(body?.podcast_id || "");
    if (!UUID.test(podcastId)) return json({ error: "Fiche introuvable." }, 400);

    // Champ piège : une réponse remplie est un robot, on fait semblant d'avoir enregistré.
    if (String(body?.website || "").trim()) return json({ ok: true });

    const nom = String(body?.nom || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const commentaire = String(body?.commentaire || "").trim();
    const note = Number(body?.note);

    if (nom.length < 2 || nom.length > 100) return json({ error: "Indiquez votre nom (2 à 100 caractères)." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 255) return json({ error: "Adresse e-mail invalide." }, 400);
    if (!Number.isInteger(note) || note < 1 || note > 5) return json({ error: "Choisissez une note de 1 à 5 étoiles." }, 400);
    if (commentaire.length < 10 || commentaire.length > 600) {
      return json({ error: "Votre commentaire doit faire entre 10 et 600 caractères." }, 400);
    }

    // Seules les fiches visibles sur le site peuvent être notées.
    const { data: visible } = await admin.rpc("podcast_visible", { _id: podcastId });
    if (!visible) return json({ error: "Ce podcast n'est pas visible sur le site pour le moment." }, 400);

    // Le déclencheur refuse : auto-avis, deuxième avis de la même personne, plus de 5 envois/heure.
    const { error } = await admin.from("avis").insert({ podcast_id: podcastId, nom, email, note, commentaire });
    if (error) {
      if (error.code === "P0001") {
        return json({ error: error.message }, error.hint === "rate_limit" ? 429 : 400);
      }
      return json({ error: "Votre avis n'a pas pu être enregistré. Réessayez dans un instant." }, 500);
    }
    return json({ ok: true });
  } catch (_e) {
    return json({ error: "Une erreur est survenue. Réessayez dans un instant." }, 500);
  }
});
