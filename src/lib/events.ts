// Mise en forme des événements : textes lisibles, adresse sans code postal, fichier agenda.

/** Retire la mention interne « Proposé par : nom (e-mail) » ajoutée aux événements proposés. */
export const publicDescription = (d?: string | null): string => (d || "").split(/\n-{3,}\n?/)[0].trim();

/** Retire les émojis et pictogrammes d'un texte (titres, descriptions), sans toucher aux lettres accentuées. */
export const sansEmojis = (t: string): string =>
  t
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^[ \t]+/gm, "")
    .trim();

/**
 * Titre d'événement en casse normale : un titre tout en capitales passe en minuscules (première lettre en capitale),
 * sans point d'exclamation, et « Apéro écoute » toujours écrit ainsi.
 */
export const readableTitle = (t: string): string => {
  let s = sansEmojis(t || "").replace(/\s*!+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  const letters = s.replace(/[^\p{L}]/gu, "");
  if (letters.length > 3 && letters === letters.toLocaleUpperCase("fr-FR")) {
    const low = s.toLocaleLowerCase("fr-FR");
    s = low.charAt(0).toLocaleUpperCase("fr-FR") + low.slice(1);
  }
  return s.replace(/ap[ée]ro\s*[-/]?\s*[ée]coute/giu, (m) => (/^A/.test(m) ? "Apéro écoute" : "apéro écoute"));
};

/** Dernier jour réel : une fin avant 6 h du matin compte pour la veille (soirée qui finit à minuit). */
const dernierJour = (fin: string): string => new Date(new Date(fin).getTime() - 6 * 3600_000).toISOString();

/** Vrai si l'événement s'étale sur plusieurs jours (heure de Paris), pas pour une soirée qui finit après minuit. */
export const surPlusieursJours = (debut: string, fin?: string | null): boolean => {
  if (!fin) return false;
  const jour = (d: string) => dateParis(d, { year: "numeric", month: "2-digit", day: "2-digit" });
  return new Date(fin).getTime() - new Date(debut).getTime() > 18 * 3600_000 && jour(dernierJour(fin)) !== jour(debut);
};

/** « 19–20.06 » pour un événement sur plusieurs jours, sinon « 09.11 » (heure de Paris). */
export const jourCourt = (debut: string, fin?: string | null): string => {
  const j = (d: string) => dateParis(d, { day: "2-digit", month: "2-digit" }).replace("/", ".");
  if (!fin || !surPlusieursJours(debut, fin)) return j(debut);
  fin = dernierJour(fin);
  const [jd, md] = j(debut).split(".");
  const [jf, mf] = j(fin).split(".");
  return md === mf ? `${jd}–${jf}.${mf}` : `${j(debut)}–${j(fin)}`;
};

/** « Du 19 au 20 juin 2026 » sur plusieurs jours, sinon « Lundi 9 novembre 2026 » (heure de Paris). */
export const dateLongue = (debut: string, fin?: string | null): string => {
  const cap = (s: string) => s.charAt(0).toLocaleUpperCase("fr-FR") + s.slice(1);
  if (!fin || !surPlusieursJours(debut, fin)) return cap(dateParis(debut, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  fin = dernierJour(fin);
  const memeMois = dateParis(debut, { month: "numeric", year: "numeric" }) === dateParis(fin, { month: "numeric", year: "numeric" });
  const memeAnnee = dateParis(debut, { year: "numeric" }) === dateParis(fin, { year: "numeric" });
  const de = memeMois ? dateParis(debut, { day: "numeric" }) : dateParis(debut, memeAnnee ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" });
  return `Du ${de.replace(/^1 /, "1er ")} au ${dateParis(fin, { day: "numeric", month: "long", year: "numeric" }).replace(/^1 /, "1er ")}`;
};

/** Adresse sans code postal ni arrondissement (règle du site pour Marseille). */
export const cleanAddress = (a?: string | null): string =>
  (a || "")
    .replace(/\b\d{5}\b\s*/g, "")
    .replace(/\s*\d+(er|e|ème)?\s+arrondissement/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*$/, "")
    .trim();

// Dates et heures des événements : toujours à l'heure de Paris, quel que soit l'appareil.
const TZ = "Europe/Paris";

/** « 18h30 » */
export const heureParis = (iso: string | Date): string =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).replace(":", "h");

/** « 18h30–21h30 », ou « 18h30 » sans heure de fin. */
export const horairesParis = (debut: string, fin?: string | null): string =>
  fin ? `${heureParis(debut)}–${heureParis(fin)}` : heureParis(debut);

/** Parties de date à l'heure de Paris (jour du mois, jour de la semaine…). */
export const dateParis = (iso: string | Date, opts: Intl.DateTimeFormatOptions): string =>
  new Date(iso).toLocaleDateString("fr-FR", { ...opts, timeZone: TZ });

/** Date ISO avec le décalage de Paris (« 2026-11-09T18:30:00+01:00 »), pour les données structurées. */
export const isoParis = (iso: string): string => {
  const d = new Date(iso);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(d).map((p) => [p.type, p.value]),
  );
  const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const offMin = Math.round((local - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  const sign = offMin >= 0 ? "+" : "-";
  const abs = Math.abs(offMin);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
};

const pad = (n: number) => String(n).padStart(2, "0");
const icsDate = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

/** Télécharge un fichier .ics pour ajouter l'événement à son agenda (aucun service externe). */
export const downloadIcs = (e: { id: string; titre: string; date_debut: string; date_fin?: string | null; lieu?: string | null; adresse?: string | null; url: string; description?: string }) => {
  const start = new Date(e.date_debut);
  const end = e.date_fin ? new Date(e.date_fin) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const location = [e.lieu, e.adresse].filter(Boolean).join(", ");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Les Podcasteur·euses du Sud//Agenda//FR",
    "BEGIN:VEVENT",
    `UID:${e.id}@les-podcasteur-euses-du-sud.fr`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(e.titre)}`,
    location ? `LOCATION:${icsEscape(location)}` : "",
    `DESCRIPTION:${icsEscape(`${e.description ? `${e.description}\n\n` : ""}${e.url}`)}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${e.titre.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
};

const gDate = (d: Date) => icsDate(d);

/** Lien « Ajouter à Google Agenda » (simple lien, aucune donnée envoyée par le site). */
export const googleCalendarUrl = (e: { titre: string; date_debut: string; date_fin?: string | null; lieu?: string | null; adresse?: string | null; url: string; description?: string }) => {
  const start = new Date(e.date_debut);
  const end = e.date_fin ? new Date(e.date_fin) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.titre,
    dates: `${gDate(start)}/${gDate(end)}`,
    details: `${e.description ? `${e.description}\n\n` : ""}${e.url}`,
    location: [e.lieu, e.adresse].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

/** Prix pour les données structurées : « 5 € » → 5, « Prix libre » / « 0 € » → 0, sinon null. */
export const prixDepuisTarif = (tarif?: string | null): number | null => {
  if (!tarif) return null;
  const m = tarif.replace(",", ".").match(/(\d+(?:\.\d+)?)\s*€/);
  if (m) return Number(m[1]);
  if (/prix libre|entrée libre|libre participation/i.test(tarif)) return 0;
  return null;
};
