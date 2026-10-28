// Mise en forme des événements : textes lisibles, adresse sans code postal, fichier agenda.

/** Retire la mention interne « Proposé par : nom (e-mail) » ajoutée aux événements proposés. */
export const publicDescription = (d?: string | null): string => (d || "").split(/\n-{3,}\n?/)[0].trim();

/** Titre en capitales (« ATELIER-ÉCOUTE ») remis en minuscules lisibles (« Atelier-écoute »). */
export const readableTitle = (t: string): string => {
  const letters = t.replace(/[^\p{L}]/gu, "");
  if (letters.length > 3 && letters === letters.toLocaleUpperCase("fr-FR")) {
    const low = t.trim().toLocaleLowerCase("fr-FR");
    return low.charAt(0).toLocaleUpperCase("fr-FR") + low.slice(1);
  }
  return t.trim();
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
