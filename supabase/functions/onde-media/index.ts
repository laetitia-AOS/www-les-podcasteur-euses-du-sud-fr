// L'Onde du Sud : lecture publique des fichiers (couverture, photos, MP3) d'un numéro PUBLIÉ,
// et des fichiers déposés par les membres (dossier depots/), seulement une fois le dépôt publié dans un numéro.
// Les fichiers d'un brouillon ne sont jamais servis ici (l'équipe les voit par des liens temporaires).
// La demande de portion (« Range ») est transmise, pour pouvoir avancer dans un MP3.
import { createClient } from "npm:@supabase/supabase-js@2";

const CHEMIN = /\/onde-media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([A-Za-z0-9_-]+)\.(jpg|png|webp|mp3)$/;
// Lot 5 : fichier déposé par un·e membre, servi seulement quand le dépôt est dans un numéro publié
const CHEMIN_DEPOT = /\/onde-media\/depots\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([A-Za-z0-9_-]+)\.(jpg|png|webp|mp3)$/;
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", mp3: "audio/mpeg" };
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "range, authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "content-length, content-range, accept-ranges",
};

// Une réponse « introuvable » n'est jamais gardée en cache : un fichier demandé avant la publication
// doit s'afficher dès que le numéro est publié.
const introuvable = () =>
  new Response("Fichier introuvable", { status: 404, headers: { ...CORS, "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Méthode non autorisée", { status: 405, headers: CORS });

  const chemin = new URL(req.url).pathname;
  const d = chemin.match(CHEMIN_DEPOT);
  const m = d ? null : chemin.match(CHEMIN);
  if (!d && !m) return introuvable();
  const [, dossier, nom, ext] = (d || m)!;

  const url = Deno.env.get("SUPABASE_URL")!;
  const cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, cle, { auth: { persistSession: false } });
  if (d) {
    const { data: publie } = await admin.rpc("onde_depot_publie", { _id: dossier });
    if (!Array.isArray(publie) || !publie.length) return introuvable();
  } else {
    const { data: numero } = await admin.from("onde_numeros").select("id").eq("id", dossier).eq("statut", "publie").maybeSingle();
    if (!numero) return introuvable();
  }
  const objet = d ? `depots/${dossier}/${nom}.${ext}` : `${dossier}/${nom}.${ext}`;

  const headers: Record<string, string> = { Authorization: `Bearer ${cle}`, apikey: cle };
  const range = req.headers.get("Range");
  if (range && /^bytes=\d*-\d*$/.test(range)) headers.Range = range;
  const r = await fetch(`${url}/storage/v1/object/onde/${objet}`, { method: req.method, headers });
  if (!r.ok && r.status !== 206) {
    await r.body?.cancel();
    return introuvable();
  }

  const out = new Headers(CORS);
  out.set("Content-Type", TYPES[ext]);
  out.set("Cache-Control", "public, max-age=3600");
  out.set("Accept-Ranges", "bytes");
  out.set("X-Content-Type-Options", "nosniff");
  for (const h of ["content-length", "content-range", "etag", "last-modified"]) {
    const v = r.headers.get(h);
    if (v) out.set(h, v);
  }
  return new Response(req.method === "HEAD" ? null : r.body, { status: r.status, headers: out });
});
