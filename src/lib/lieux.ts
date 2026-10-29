// Studios et structures : services, fiches enrichies et demande de devis.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Les 7 services d'un studio (codes vérifiés côté serveur). */
export const SERVICES_STUDIO = [
  { value: "location", label: "Location du studio" },
  { value: "enregistrement_audio", label: "Enregistrement audio" },
  { value: "video_podcast", label: "Vidéo-podcast" },
  { value: "montage", label: "Montage" },
  { value: "realisation", label: "Réalisation" },
  { value: "direct", label: "Direct" },
  { value: "studio_mobile", label: "Studio mobile" },
] as const;

export const serviceLabel = (code: string) => SERVICES_STUDIO.find((s) => s.value === code)?.label ?? code;

export const DEPARTEMENTS_SUD = [
  { code: "04", label: "Alpes-de-Haute-Provence" },
  { code: "05", label: "Hautes-Alpes" },
  { code: "06", label: "Alpes-Maritimes" },
  { code: "13", label: "Bouches-du-Rhône" },
  { code: "83", label: "Var" },
  { code: "84", label: "Vaucluse" },
];

export type Faq = { q: string; r: string };
export type Lien = { label: string; url: string };
export type Proposition = { titre: string; texte: string };
export type Presse = { titre: string; url: string; date?: string };
export type PodcastLie = { id: string; date?: string; url?: string };
export type Equipement = { micros?: string; cameras?: string; lumieres_decor?: string; technicien?: boolean };

export type FicheLieu = {
  podcast_id: string;
  tarif_heure: number | null;
  capacite_voix: number | null;
  acces_transports: string | null;
  services: string[];
  photos: string[];
  equipement: Equipement;
  accessibilite: string | null;
  faq: Faq[];
  liens: Lien[];
  propositions: Proposition[];
  presse: Presse[];
  podcasts_lies: PodcastLie[];
  intitule_membres: "antenne" | "accompagnes";
};

export const ficheVide = (podcastId: string): FicheLieu => ({
  podcast_id: podcastId,
  tarif_heure: null,
  capacite_voix: null,
  acces_transports: null,
  services: [],
  photos: [],
  equipement: {},
  accessibilite: null,
  faq: [],
  liens: [],
  propositions: [],
  presse: [],
  podcasts_lies: [],
  intitule_membres: "accompagnes",
});

/** « à partir de 45 € / heure » */
export const formatTarif = (t: number | null | undefined) =>
  t == null ? null : `à partir de ${Number.isInteger(Number(t)) ? Number(t) : Number(t).toFixed(2).replace(".", ",")} € / heure`;

/** « 4 voix » */
export const formatCapacite = (n: number | null | undefined) => (n == null ? null : `${n} voix`);

/** Mois ou date courte : « mars 2026 », « 12 mars 2026 ». */
export const formatDateCourte = (d?: string) => {
  if (!d) return null;
  const [y, m, j] = d.split("-").map(Number);
  if (!y || !m) return null;
  const date = new Date(Date.UTC(y, m - 1, j || 1));
  return date.toLocaleDateString("fr-FR", j ? { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" } : { month: "long", year: "numeric", timeZone: "UTC" });
};

/** Fiches enrichies de plusieurs lieux (lecture publique limitée aux fiches visibles). */
export const useFichesLieux = (ids: string[]) =>
  useQuery({
    queryKey: ["fiches-lieux", [...ids].sort().join(",")],
    queryFn: async () => {
      if (!ids.length) return {} as Record<string, FicheLieu>;
      const { data, error } = await supabase.from("fiches_lieux").select("*").in("podcast_id", ids);
      if (error) throw error;
      const out: Record<string, FicheLieu> = {};
      for (const r of (data || []) as unknown as FicheLieu[]) out[r.podcast_id] = r;
      return out;
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });

export const useAnneeAdhesion = (id?: string) =>
  useQuery({
    queryKey: ["annee-adhesion", id],
    queryFn: async () => {
      const { data } = await supabase.rpc("annee_adhesion", { _podcast_id: id! });
      return (data as number | null) ?? null;
    },
    enabled: !!id,
    staleTime: 60 * 60 * 1000,
  });

export type DevisInput = {
  nom: string;
  email: string;
  format: string;
  periode: string;
  departement: string;
  besoins: string[];
  description: string;
  studio_id?: string | null;
  website?: string;
};

/** Envoie une demande de devis ; le serveur choisit les studios et renvoie leur nombre. */
export const envoyerDevis = async (input: DevisInput): Promise<{ ok: boolean; count: number; message?: string }> => {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demande-devis`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; count?: number; error?: string; message?: string };
    if (!res.ok) return { ok: false, count: 0, message: body.error || "La demande n'a pas pu partir. Réessayez dans un instant." };
    return { ok: true, count: body.count ?? 0, message: body.message };
  } catch {
    return { ok: false, count: 0, message: "La demande n'a pas pu partir. Vérifiez votre connexion et réessayez." };
  }
};

/** Phrase de confirmation : « Votre demande est partie vers 4 studios. » */
export const phraseDevisEnvoye = (n: number) =>
  n === 1 ? "Votre demande est partie vers 1 studio." : `Votre demande est partie vers ${n} studios.`;

/** Adresse sans « https:// » ni « www. » ni barre finale, pour repérer deux fois le même lien. */
const cleLien = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
const domaine = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

/**
 * Liens d'un studio ou d'une structure, chacun une seule fois : le site principal s'appelle « Site » ;
 * un autre lien nommé « Site » prend le nom de son domaine (« agencesonore.fr »).
 */
export const liensLieu = (principal: string | null | undefined, liens: Lien[], extra: (string | null | undefined)[] = []): Lien[] => {
  const vus = new Set<string>();
  const out: Lien[] = [];
  const ajouter = (label: string, url?: string | null) => {
    if (!url || !url.trim()) return;
    const k = cleLien(url);
    if (vus.has(k)) return;
    vus.add(k);
    const pris = out.some((l) => l.label.toLowerCase() === label.toLowerCase());
    out.push({ label: pris ? domaine(url) : label, url });
  };
  ajouter("Site", principal);
  for (const l of liens) ajouter(l.label || "Lien", l.url);
  for (const u of extra) ajouter(/linkedin\.com/i.test(u || "") ? "LinkedIn" : domaine(u || ""), u);
  return out;
};

export type EvenementLieu = { id: string; titre: string; slug: string | null; date_debut: string; date_fin: string | null; lieu: string | null };

/** Trie les événements d'un lieu : à venir d'abord (du plus proche au plus lointain), puis passés (du plus récent). */
export const trierEvenementsLieu = (evts: EvenementLieu[], now = Date.now()) => {
  const fin = (e: EvenementLieu) => new Date(e.date_fin || e.date_debut).getTime();
  const aVenir = evts.filter((e) => fin(e) >= now).sort((a, b) => a.date_debut.localeCompare(b.date_debut));
  const passes = evts.filter((e) => fin(e) < now).sort((a, b) => b.date_debut.localeCompare(a.date_debut));
  return { aVenir, passes };
};

/**
 * Événements publiés de l'agenda liés à un studio ou une structure : reliés par l'équipe, proposés par lui,
 * ou dont le titre ou le lieu porte son nom.
 */
export const useEvenementsLieu = (id?: string, nom?: string) =>
  useQuery({
    queryKey: ["evenements-lieu", id, nom],
    queryFn: async () => {
      const motif = (nom || "").normalize("NFC").replace(/[^\p{L}\p{N} '’-]+/gu, " ").replace(/\s+/g, " ").trim();
      const conds = [`structure_id.eq.${id}`, `propose_par.eq.${id}`];
      if (motif.length >= 4) conds.push(`titre.ilike.*${motif}*`, `lieu.ilike.*${motif}*`);
      const { data, error } = await supabase.from("evenements").select("id, titre, slug, date_debut, date_fin, lieu")
        .eq("statut", "publie").or(conds.join(",")).order("date_debut", { ascending: false }).limit(20);
      if (error) throw error;
      return trierEvenementsLieu((data || []) as EvenementLieu[]);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
