/** Polices pour les dessins faits dans le navigateur (couverture de L'Onde, visuels d'événements). */

let etroite: Promise<string> | null = null;
const FAMILLE_ETROITE = "Archivo Onde 64";
/** Archivo 900 en largeur 64 (comme les titres du site), chargée depuis Google Fonts pour le dessin. */
export const chargerArchivoEtroit = () =>
  (etroite ??= (async () => {
    try {
      const css = await (await fetch("https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@64,900&display=swap")).text();
      const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => {
        const src = /src:\s*url\(([^)]+)\)/.exec(m[1])?.[1];
        const plage = /unicode-range:\s*([^;]+);/.exec(m[1])?.[1]?.trim();
        return src && /^https:\/\/fonts\.gstatic\.com\//.test(src)
          ? new FontFace(FAMILLE_ETROITE, `url(${src})`, { weight: "900", stretch: "64%", ...(plage ? { unicodeRange: plage } : {}) })
          : null;
      }).filter((f): f is FontFace => !!f);
      if (!faces.length) throw new Error("police");
      await Promise.all(faces.map((f) => f.load()));
      faces.forEach((f) => document.fonts.add(f));
      return `"${FAMILLE_ETROITE}"`;
    } catch {
      etroite = null;
      return "";
    }
  })());
