// Styles partagés de la refonte (boutons, conteneur) et petites fonctions de mise en forme.

export const container = "mx-auto w-full max-w-[1240px] px-5 sm:px-8";

const btnBase =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-5 font-bold text-[15px] leading-none transition-colors disabled:opacity-50 disabled:pointer-events-none";

export const btnPrimary = `${btnBase} bg-primary text-primary-foreground hover:bg-primary-hover`;
export const btnSecondary = `${btnBase} border-2 border-encre text-foreground bg-transparent hover:bg-encre hover:text-surface`;
export const btnListen = `${btnBase} bg-accent text-accent-foreground hover:bg-accent-hover`;
/** Ligne descriptive placée dans le H1, sous le grand titre : plus petite, en casse normale. */
export const h1Ligne = "block mt-4 text-[19px] sm:text-[23px] font-semibold normal-case [font-stretch:100%] leading-snug tracking-normal max-w-[40ch]";
export const linkUnderline = "font-bold underline underline-offset-4 decoration-2 hover:decoration-accent";

/** Met une majuscule à chaque mot d'un prénom ou d'un nom (gère les traits d'union et apostrophes). */
export const formatName = (s?: string | null): string => {
  if (!s) return "";
  return s
    .trim()
    .toLocaleLowerCase("fr-FR")
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase("fr-FR"));
};

export const fullName = (prenom?: string | null, nom?: string | null) =>
  [formatName(prenom), formatName(nom)].filter(Boolean).join(" ");

/** Ville sans code postal ni arrondissement (« Marseille 6e Arrondissement » → « Marseille »). */
export const cleanCity = (city?: string | null): string => {
  if (!city) return "";
  return city
    .replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "")
    .replace(/\s+\d+$/, "")
    .trim();
};

export const formatDuration = (seconds?: number | null): string => {
  if (!seconds || seconds <= 0) return "";
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
};

export const formatClock = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const formatShortDate = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".");
};
