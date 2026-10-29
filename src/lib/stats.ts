import { supabase } from "@/integrations/supabase/client";

export type TypeStat = "vue" | "ecoute";

const dejaEnvoye = new Set<string>();

/**
 * Compte une vue de fiche ou une écoute lancée depuis le site (côté serveur, une fois par jour et par visiteur·ice).
 * Ne bloque jamais la page : en cas d'échec, rien ne s'affiche.
 */
export const compterStat = (podcastId: string | null | undefined, type: TypeStat) => {
  if (!podcastId) return;
  const cle = `${type}:${podcastId}`;
  if (dejaEnvoye.has(cle)) return;
  dejaEnvoye.add(cle);
  void (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compter-stat`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${session?.access_token || key}`,
        },
        body: JSON.stringify({ podcast_id: podcastId, type }),
      });
    } catch {
      /* chiffres non essentiels */
    }
  })();
};
