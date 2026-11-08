import { supabase } from "@/integrations/supabase/client";

export type TypeStat = "vue" | "ecoute";

const dejaEnvoye = new Set<string>();

/**
 * Compte une vue de fiche ou une écoute lancée depuis le site (côté serveur, une fois par jour et par visiteur·ice).
 * Ne bloque jamais la page : en cas d'échec, rien ne s'affiche.
 */
/** Adresses du site publié : les visites de l'aperçu et des tests ne sont pas comptées. */
const SITES_PUBLIES = ["www.les-podcasteur-euses-du-sud.fr", "les-podcasteur-euses-du-sud.fr", "www-les-podcasteur-euses-du-sud-fr.lovable.app"];

/** Pages privées, jamais comptées. */
const PAGES_PRIVEES = /^\/(admin|espace-membre|espace-podcasteur|mon-espace|mon-podcast|reset-password|bienvenue)(\/|$)/;

export type Provenance = "direct" | "google" | "bing" | "autre-moteur" | "linkedin" | "facebook" | "instagram" | "whatsapp" | "x" | "autre-site";

/** Range l'adresse de la page d'où arrive la personne dans une grande famille (jamais l'adresse elle-même). */
export const provenanceDe = (referrer: string, siteHote: string): Provenance => {
  let hote = "";
  try { hote = new URL(referrer).hostname.toLowerCase(); } catch { return "direct"; }
  if (!hote || hote === siteHote || hote.endsWith("les-podcasteur-euses-du-sud.fr")) return "direct";
  if (/(^|\.)google\./.test(hote)) return "google";
  if (/(^|\.)bing\.com$/.test(hote)) return "bing";
  if (/(duckduckgo|qwant|ecosia|yahoo|yandex|startpage|brave|ecosia)\./.test(hote)) return "autre-moteur";
  if (/(^|\.)(linkedin\.com|lnkd\.in)$/.test(hote)) return "linkedin";
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(hote)) return "facebook";
  if (/(^|\.)instagram\.com$/.test(hote)) return "instagram";
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(hote)) return "whatsapp";
  if (/(^|\.)(t\.co|x\.com|twitter\.com)$/.test(hote)) return "x";
  return "autre-site";
};

/** Adresse de page à compter (minuscules, sans paramètres), ou null si elle ne doit pas l'être. */
export const pageACompter = (chemin: string): string | null => {
  let p = (chemin || "/").toLowerCase().split(/[?#]/)[0];
  try { p = decodeURIComponent(p); } catch { /* adresse laissée telle quelle */ }
  if (p.length > 1) p = p.replace(/\/+$/, "");
  if (PAGES_PRIVEES.test(p)) return null;
  return /^\/[a-z0-9/-]{0,120}$/.test(p) ? p : null;
};

let provenanceEntree: Provenance | null = null;

/** Compte la visite d'une page publique (une personne compte une fois par jour, pas de cookie). */
export const compterVisite = (chemin: string) => {
  if (typeof window === "undefined" || !SITES_PUBLIES.includes(window.location.hostname)) return;
  const page = pageACompter(chemin);
  if (!page) return;
  if (!provenanceEntree) provenanceEntree = provenanceDe(document.referrer, window.location.hostname);
  void fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compter-stat`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ type: "visite", page, provenance: provenanceEntree }),
  }).catch(() => { /* chiffres non essentiels */ });
};

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
