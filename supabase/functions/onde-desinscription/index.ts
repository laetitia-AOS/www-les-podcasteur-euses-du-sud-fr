// Désinscription en un clic depuis la messagerie (en-têtes List-Unsubscribe / List-Unsubscribe-Post).
// POST : désinscrit tout de suite, sans connexion. GET : renvoie vers la page du site, qui fait de même avec « Me réinscrire ».
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const SITE = "https://www.les-podcasteur-euses-du-sud.fr";
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const jeton = (new URL(req.url).searchParams.get("jeton") || "").trim();
  const valide = RE_UUID.test(jeton);
  if (req.method === "GET" || req.method === "HEAD") {
    return new Response(null, { status: 302, headers: { Location: valide ? `${SITE}/onde/desinscription?jeton=${jeton}` : `${SITE}/onde` } });
  }
  if (req.method !== "POST") return new Response("Méthode non autorisée", { status: 405 });
  if (!valide) return new Response("Lien invalide", { status: 400 });
  const pub = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { error } = await pub.rpc("onde_desinscrire", { _jeton: jeton });
  if (error) {
    console.error("desinscription", error.message);
    return new Response("Erreur", { status: 500 });
  }
  return new Response("Désinscription enregistrée.", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
});
