// Lecture planifiée (toutes les 6 heures) des flux RSS : enregistre les 10 derniers épisodes
// de chaque podcast visible dont le membre est à jour. Seule cette fonction écrit les épisodes.
// Elle ne modifie jamais les fiches. Une lecture complète au plus toutes les 5 h 30, quel que soit l'appelant.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { parseFeed, raisonLisible, resolveFeed, safeFetchText } from "../_shared/flux.ts";

const MAX_EPISODES = 10;
const CONCURRENCE = 5;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Row = { id: string; email: string; nom_podcast: string; lien_ecoute: string | null; flux_rss: string | null };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: runId, error: runError } = await admin.rpc("demarrer_sync_episodes");
  if (runError) return json({ error: "Démarrage impossible" }, 500);
  if (!runId) return json({ ok: true, skipped: "Une lecture a déjà eu lieu il y a moins de 5 h 30." });

  try {
    const { data: rows } = await admin
      .from("podcasts")
      .select("id, email, nom_podcast, lien_ecoute, flux_rss")
      .eq("valide", true)
      .eq("type_profil", "podcasteur");
    const all = (rows || []) as Row[];

    // Membres à jour (une seule vérification par adresse)
    const emails = [...new Set(all.map((r) => r.email.toLowerCase()))];
    const aJour = new Set<string>();
    for (const e of emails) {
      const { data } = await admin.rpc("membre_a_jour", { _email: e });
      if (data) aJour.add(e);
    }
    const eligibles = all.filter((r) => aJour.has(r.email.toLowerCase()));

    // Les épisodes des podcasts qui ne sont plus éligibles sont retirés
    const eligibleIds = eligibles.map((r) => r.id);
    if (eligibleIds.length) {
      await admin.from("episodes").delete().not("podcast_id", "in", `(${eligibleIds.join(",")})`);
    } else {
      await admin.from("episodes").delete().not("id", "is", null);
    }

    // Décisions déjà prises sur les flux trouvés automatiquement (gardées tant que l'adresse ne change pas)
    const { data: anciens } = await admin.from("flux_etat").select("podcast_id, flux_url, confirmation");
    const avant = new Map((anciens || []).map((x) => [x.podcast_id, x]));

    let totalEpisodes = 0;
    const queue = [...eligibles];
    const worker = async () => {
      while (queue.length) {
        const p = queue.shift()!;
        const now = new Date().toISOString();
        let fluxUrl: string | null = null;
        let confirmation = "a_confirmer";
        let infos: { titre: string | null; auteur: string | null } = { titre: null, auteur: null };
        const etat = async (statut: string, message: string | null, source: string | null, nb: number) => {
          await admin.from("flux_etat").upsert({
            podcast_id: p.id, statut, message, source, nb_episodes: nb, derniere_lecture: now,
            flux_url: fluxUrl, flux_titre: infos.titre, flux_auteur: infos.auteur, confirmation,
          });
        };
        try {
          const feed = await resolveFeed(p);
          if (!feed) { await etat("introuvable", "Aucun flux RSS trouvé : ajoutez le lien du flux dans Mes podcasts.", null, 0); continue; }
          fluxUrl = feed.url;
          // Flux saisi par le membre : confirmé d'office. Flux deviné : « à confirmer » par un·e admin,
          // sauf si la même adresse a déjà été confirmée ou refusée.
          const prec = avant.get(p.id);
          confirmation = feed.source === "flux saisi" ? "confirme"
            : prec && prec.flux_url === feed.url && prec.confirmation !== "a_confirmer" ? prec.confirmation : "a_confirmer";
          const r = await safeFetchText(feed.url);
          if (!r.ok) { await etat("erreur", raisonLisible(r.reason), feed.source, 0); continue; }
          const parsed = parseFeed(r.text, MAX_EPISODES);
          if (!parsed) { await etat("erreur", "Le lien ne mène pas à un flux RSS.", feed.source, 0); continue; }
          infos = { titre: parsed.titre, auteur: parsed.auteur };
          if (!parsed.episodes.length) { await etat("erreur", "Le flux ne contient aucun épisode audio.", feed.source, 0); continue; }
          // Flux refusé par l'équipe : aucun épisode gardé
          if (confirmation === "refuse") {
            await admin.from("episodes").delete().eq("podcast_id", p.id);
            await etat("ok", null, feed.source, 0);
            continue;
          }

          const { error } = await admin.from("episodes").upsert(
            parsed.episodes.map((e) => ({ ...e, podcast_id: p.id, mis_a_jour: now })),
            { onConflict: "podcast_id,guid" },
          );
          if (error) { await etat("erreur", "Les épisodes n'ont pas pu être enregistrés.", feed.source, 0); continue; }
          // On ne garde que les 10 derniers
          const guids = parsed.episodes.map((e) => e.guid);
          const { data: existing } = await admin.from("episodes").select("id, guid").eq("podcast_id", p.id);
          const toDelete = (existing || []).filter((x) => !guids.includes(x.guid)).map((x) => x.id);
          if (toDelete.length) await admin.from("episodes").delete().in("id", toDelete);
          totalEpisodes += parsed.episodes.length;
          await etat("ok", null, feed.source, parsed.episodes.length);
        } catch (e) {
          console.error("sync podcast:", e instanceof Error ? e.message : "unknown");
          await etat("erreur", "Le flux n'a pas pu être lu.", null, 0);
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCE }, worker));

    await admin.from("sync_episodes_runs").update({ finished_at: new Date().toISOString(), podcasts: eligibles.length, episodes: totalEpisodes }).eq("id", runId);
    return json({ ok: true, podcasts: eligibles.length, episodes: totalEpisodes });
  } catch (e) {
    console.error("sync-episodes:", e instanceof Error ? e.message : "unknown");
    return json({ error: "Lecture interrompue" }, 500);
  }
});
