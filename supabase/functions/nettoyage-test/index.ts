// Fonction temporaire : supprime uniquement les images de test des adresses fictives @exemple.test.
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await admin.from("images_en_attente").select("id, bucket_cible, chemin").like("email", "%@exemple.test");
  const rows = data || [];
  const paths = rows.map((r) => `${r.bucket_cible}/${r.chemin}`);
  const { error } = paths.length ? await admin.storage.from("images-en-attente").remove(paths) : { error: null };
  if (!error && rows.length) await admin.from("images_en_attente").delete().in("id", rows.map((r) => r.id));
  return new Response(JSON.stringify({ fichiers: paths.length, erreur: error?.message ?? null }), { headers: { "Content-Type": "application/json" } });
});
