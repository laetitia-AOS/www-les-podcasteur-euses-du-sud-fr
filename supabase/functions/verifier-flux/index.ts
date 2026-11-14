// Vérifie qu'un lien est bien un flux RSS de podcast lisible, avant de l'enregistrer.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { hebergeurConnu, isSafePublicUrl, parseFeed, raisonLisible, safeFetchText } from "../_shared/flux.ts";

const MAX_PAR_HEURE = 20;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const hash = async (s: string) => {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`pds-flux:${s}`));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
};

/**
 * Une personne connectée qui a une fiche (ou un·e admin) peut faire lire n'importe quelle adresse publique.
 * Sans connexion (inscription en cours), seuls les hébergeurs de podcasts connus sont lus.
 */
// deno-lint-ignore no-explicit-any
const lectureLibre = async (req: Request, admin: any): Promise<boolean> => {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const { data } = await admin.auth.getUser(auth.slice(7));
  const user = data?.user;
  if (!user?.email) return false;
  const { data: role } = await admin.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (role) return true;
  const { count } = await admin.from("podcasts").select("id", { count: "exact", head: true }).ilike("email", user.email.replace(/[\\%_]/g, "\\$&"));
  return (count || 0) > 0;
};

const dateFr = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }) : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, message: "Méthode non autorisée" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const url = String(body?.url || "").trim();
    if (!url) return json({ ok: false, message: "Indiquez le lien du flux RSS." }, 400);
    if (url.length > 500) return json({ ok: false, message: "Ce lien est trop long." }, 400);
    if (!/^https:\/\//i.test(url)) return json({ ok: false, message: "Le lien du flux RSS doit commencer par https://" }, 400);
    if (!isSafePublicUrl(url)) return json({ ok: false, message: raisonLisible("adresse") }, 400);

    // 20 vérifications par heure et par appareil (adresse réseau, enregistrée sous forme chiffrée)
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "inconnu";
    const appareil = await hash(ip);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin.from("verifications_flux").select("id", { count: "exact", head: true })
      .eq("appareil", appareil).gte("created_at", since);
    if ((count || 0) >= MAX_PAR_HEURE) {
      return json({ ok: false, message: "Trop de vérifications en une heure. Réessayez un peu plus tard." }, 429);
    }
    await admin.from("verifications_flux").insert({ appareil });
    // Ménage : les traces de plus d'un jour ne servent plus
    await admin.from("verifications_flux").delete().lt("created_at", new Date(Date.now() - 86400000).toISOString());

    const libre = await lectureLibre(req, admin);
    const r = await safeFetchText(url, undefined, undefined, libre ? undefined : hebergeurConnu);
    // Hébergeur inconnu pendant l'inscription : le flux est accepté sans être lu ici ;
    // la lecture régulière des flux le vérifiera, et l'équipe voit son état dans l'admin.
    if (!r.ok && r.reason === "hors_liste") {
      return json({ ok: true, verifie: false, message: "Flux enregistré : il sera vérifié après la validation de votre fiche." });
    }
    if (!r.ok) return json({ ok: false, message: raisonLisible(r.reason) });
    const parsed = parseFeed(r.text, 1);
    if (!parsed) return json({ ok: false, message: "Ce lien ne mène pas à un flux RSS. Copiez le lien « RSS » donné par votre hébergeur (Ausha, Acast, Spotify for Creators…)." });
    if (!parsed.total) return json({ ok: false, message: "Ce flux ne contient aucun épisode audio." });
    const last = dateFr(parsed.episodes[0]?.date_publication ?? null);
    return json({
      ok: true,
      message: `Flux valide : ${parsed.total} épisode${parsed.total > 1 ? "s" : ""}${last ? `, dernier le ${last}` : ""}.`,
    });
  } catch (e) {
    console.error("verifier-flux:", e instanceof Error ? e.message : "unknown");
    return json({ ok: false, message: "La vérification n'a pas pu se faire. Réessayez dans un instant." }, 500);
  }
});
