/**
 * Cellule d'export tableur sûre : un texte saisi par un·e visiteur·ice qui commence
 * par = + - @ (ou tabulation / retour) serait lu comme une formule par Excel ou Sheets.
 * On le préfixe d'une apostrophe pour qu'il reste un simple texte.
 */
export const csvCell = (value: unknown): string => {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export const toCsv = (rows: unknown[][]): string => rows.map((r) => r.map(csvCell).join(",")).join("\n");
