// L'Onde du Sud : numéros affichés au-dessus des blocs (01, 02…), partagés par la page, le PDF et l'e-mail.
// Module sans dépendance (fonctions serveur Deno et site).

/** Blocs qui ne portent pas de numéro dans L'Onde : « À l'écoute » (podcast du mois). */
export const BLOCS_SANS_NUMERO: ReadonlySet<string> = new Set(["podcast"]);

/** « 01 », « 02 »… pour chaque bloc, ou null pour un bloc sans numéro (les suivants ne sautent pas de numéro). */
export const numerosAffiches = (blocs: ReadonlyArray<{ type: string }>): (string | null)[] => {
  let k = 0;
  return blocs.map((b) => (BLOCS_SANS_NUMERO.has(b.type) ? null : String(++k).padStart(2, "0")));
};

/** Lien externe accepté pour « Ce qui bouge » et « Pour aller plus loin » : adresse complète en https (même règle que la base, onde_lien_https). */
export const lienHttps = (l?: string | null): l is string =>
  !!l && l.length <= 500 && /^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]{1,5})?([/?#][^\s<>"'`\\]*)?$/i.test(l);
