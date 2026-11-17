// L'Onde du Sud : couverture générée dans le navigateur à partir de la version audio du numéro.
// Règle de la direction artistique : toujours sur fond encre ; seule la forme d'onde (tirée du vrai son) change chaque mois.
// Le son lu est uniquement la version audio du numéro, déjà dans l'espace privé « onde » (lien temporaire de l'équipe) :
// aucune adresse extérieure n'est acceptée.
import { libelleType, moisAnnee, type Bloc, type NumeroOnde } from "@/lib/onde";
import { chargerArchivoEtroit } from "@/lib/policeCanvas";

export const BARRES_COUVERTURE = 46;
export const ADRESSE_ONDE = "les-podcasteur-euses-du-sud.fr/onde";
export type FormatCouverture = "portrait" | "partage";
export const TAILLES_COUVERTURE: Record<FormatCouverture, [number, number]> = { portrait: [1080, 1350], partage: [1200, 630] };

/** Niveau sonore (moyenne quadratique) de chaque tranche du son, de 0 à 1 (la tranche la plus forte vaut 1). */
export const niveauxTranches = (canaux: ArrayLike<number>[], barres = BARRES_COUVERTURE): number[] => {
  const len = canaux[0]?.length ?? 0;
  if (!len || barres < 1) return Array(Math.max(0, barres)).fill(0);
  const out: number[] = [];
  for (let k = 0; k < barres; k++) {
    const a = Math.floor((k * len) / barres);
    const z = Math.max(a + 1, Math.floor(((k + 1) * len) / barres));
    let somme = 0;
    for (let i = a; i < z && i < len; i++) {
      let v = 0;
      for (const c of canaux) v += c[i];
      v /= canaux.length;
      somme += v * v;
    }
    out.push(Math.sqrt(somme / (z - a)));
  }
  const max = Math.max(...out);
  return max > 0 ? out.map((v) => v / max) : out;
};

/** Adresse de lien temporaire acceptée : uniquement un fichier de l'espace privé « onde » du site. */
export const lienAudioAccepte = (lien: string, base = import.meta.env.VITE_SUPABASE_URL as string) =>
  !!base && lien.startsWith(`${base}/storage/v1/object/sign/onde/`);

/** Lit la version audio du numéro (lien temporaire de l'équipe) et calcule la forme d'onde. */
export async function formeOndeAudio(lienSigne: string, barres = BARRES_COUVERTURE): Promise<number[]> {
  if (!lienAudioAccepte(lienSigne)) throw new Error("Seule la version audio du numéro, envoyée depuis l'éditeur, peut servir à la couverture.");
  const r = await fetch(lienSigne);
  if (!r.ok) throw new Error("La version audio n'a pas pu être lue. Réessaie dans un instant.");
  const buf = await r.arrayBuffer();
  const Ctx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  // Décodé à 8 000 échantillons par seconde : assez pour la forme d'onde, léger en mémoire même pour un long MP3
  const ctx = new Ctx(1, 8000, 8000);
  const audio = await new Promise<AudioBuffer>((res, rej) => {
    const p = ctx.decodeAudioData(buf, res, rej);
    if (p && typeof p.then === "function") p.then(res, rej);
  }).catch(() => { throw new Error("Ce fichier audio n'a pas pu être décodé."); });
  const canaux = Array.from({ length: audio.numberOfChannels }, (_, c) => audio.getChannelData(c));
  return niveauxTranches(canaux, barres);
}

/** « Dans ce numéro » : titres des 4 premiers blocs (nom du podcast pour « À l'écoute », sinon titre, sinon étiquette). */
export const titresDansCeNumero = (blocs: Bloc[], nomsPodcasts: Record<string, string> = {}, max = 4): string[] =>
  blocs.slice(0, max).map((b) => {
    const titre = "titre" in b ? (b.titre || "").trim() : "";
    const podcast = b.type === "podcast" && b.podcast_id ? (nomsPodcasts[b.podcast_id] || "").trim() : "";
    return (b.type === "podcast" ? podcast || (b.rubrique || "").trim() : titre || (b.rubrique || "").trim()) || libelleType(b.type);
  });

/** « N°1 · DÉCEMBRE 2026 » */
export const mentionNumero = (n: Pick<NumeroOnde, "numero" | "mois">) => `N°${n.numero} · ${moisAnnee(n.mois)}`.toLocaleUpperCase("fr-FR");

export const nomFichierCouverture = (n: Pick<NumeroOnde, "slug" | "numero">, f: FormatCouverture) => {
  const [w, h] = TAILLES_COUVERTURE[f];
  return `onde-${n.slug || `n${n.numero}`}-couverture-${w}x${h}.png`;
};

// ——— Dessin ———

const couleur = (v: string, defaut: string) => {
  const brut = typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue(v).trim() : "";
  return brut ? `hsl(${brut})` : defaut;
};



const chargerImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/** Coupe un texte trop long pour la largeur, avec « … ». */
const tenir = (ctx: CanvasRenderingContext2D, t: string, largeur: number) => {
  if (ctx.measureText(t).width <= largeur) return t;
  let s = t;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > largeur) s = s.slice(0, -1);
  return `${s.trimEnd()}…`;
};

export type InfoCouverture = Pick<NumeroOnde, "numero" | "mois"> & { titres: string[]; niveaux: number[] };

/** Dessine la couverture (1080 × 1350 ou 1200 × 630) et renvoie l'image PNG. */
export async function dessinerCouverture(info: InfoCouverture, format: FormatCouverture): Promise<Blob> {
  const [W, H] = TAILLES_COUVERTURE[format];
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  await Promise.all([
    document.fonts.load('800 40px "Archivo"'), document.fonts.load('700 32px "Archivo"'),
    document.fonts.load('500 26px "IBM Plex Mono"'), document.fonts.load('700 26px "IBM Plex Mono"'),
  ].map((p) => p.catch(() => null)));
  const [famille, logo] = await Promise.all([chargerArchivoEtroit(), chargerImage("/favicon.png")]);
  const encre = couleur("--pds-encre", "#0F0F12"), orange = couleur("--pds-orange", "#F28C28"), fond = couleur("--pds-fond", "#F3F2EE");
  const titreFont = (taille: number) => {
    if (famille) return `900 ${taille}px ${famille}, "Archivo", sans-serif`;
    // Police étroite indisponible : Archivo en largeur réduite par le navigateur
    (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "extra-condensed";
    return `900 extra-condensed ${taille}px "Archivo", sans-serif`;
  };
  const portrait = format === "portrait";
  const pad = portrait ? 80 : 56;
  const largeur = W - pad * 2;

  ctx.fillStyle = encre; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "top";

  // En-tête : logo et nom de l'association à gauche, numéro et mois à droite (données en mono)
  const tLogo = portrait ? 72 : 56;
  const yTete = portrait ? 80 : 44;
  if (logo) ctx.drawImage(logo, pad, yTete, tLogo, tLogo);
  ctx.fillStyle = fond;
  ctx.font = `800 ${portrait ? 30 : 24}px "Archivo", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("Les Podcasteur·euses du Sud", pad + tLogo + 22, yTete + tLogo / 2);
  ctx.font = `500 ${portrait ? 26 : 21}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "right";
  ctx.fillText(mentionNumero(info), W - pad, yTete + tLogo / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const yFilet = yTete + tLogo + (portrait ? 32 : 24);
  ctx.fillRect(pad, yFilet, largeur, portrait ? 4 : 3);

  // « La lettre mensuelle » puis le titre « L'ONDE DU SUD. » (point final orange)
  const colGauche = portrait ? largeur : 600;
  let y = yFilet + (portrait ? 44 : 30);
  ctx.fillStyle = orange;
  ctx.font = `800 ${portrait ? 44 : 30}px "Archivo", sans-serif`;
  ctx.fillText("La lettre mensuelle", pad, y);
  y += portrait ? 66 : 44;
  const lignesTitre = portrait ? ["L'ONDE", "DU SUD"] : ["L'ONDE DU SUD"];
  let taille = portrait ? 196 : 140;
  ctx.font = titreFont(taille);
  const plusLarge = () => Math.max(...lignesTitre.map((l, i) => ctx.measureText(i === lignesTitre.length - 1 ? `${l}.` : l).width));
  while (plusLarge() > colGauche && taille > 40) { taille -= 4; ctx.font = titreFont(taille); }
  for (const [i, l] of lignesTitre.entries()) {
    ctx.fillStyle = fond;
    ctx.fillText(l, pad, y);
    if (i === lignesTitre.length - 1) { ctx.fillStyle = orange; ctx.fillText(".", pad + ctx.measureText(l).width, y); }
    y += taille * 0.9;
  }

  // Forme d'onde : 46 barres orange, angles droits, hauteur proportionnelle au niveau sonore de chaque tranche
  y += portrait ? 30 : 22;
  const hOnde = portrait ? 170 : 150;
  const niveaux = info.niveaux.length ? info.niveaux : Array(BARRES_COUVERTURE).fill(0);
  const pasBarre = colGauche / niveaux.length;
  const lBarre = Math.max(2, Math.round(pasBarre * 0.6));
  ctx.fillStyle = orange;
  niveaux.forEach((v, k) => {
    const h = Math.max(4, Math.round(Math.min(1, Math.max(0, v)) * hOnde));
    ctx.fillRect(Math.round(pad + k * pasBarre + (pasBarre - lBarre) / 2), Math.round(y + (hOnde - h) / 2), lBarre, h);
  });
  y += hOnde;

  // « Dans ce numéro » : les titres des 4 premiers blocs (numéros en mono)
  const xListe = portrait ? pad : pad + colGauche + 56;
  const lListe = portrait ? largeur : W - pad - xListe;
  let yListe = portrait ? y + 40 : yFilet + 30;
  ctx.fillStyle = orange;
  ctx.font = `800 ${portrait ? 28 : 22}px "Archivo", sans-serif`;
  ctx.fillText("DANS CE NUMÉRO", xListe, yListe);
  yListe += portrait ? 50 : 40;
  const tItem = portrait ? 32 : 24;
  info.titres.slice(0, 4).forEach((t, k) => {
    ctx.fillStyle = orange;
    ctx.font = `700 ${tItem - 6}px "IBM Plex Mono", monospace`;
    ctx.fillText(String(k + 1).padStart(2, "0"), xListe, yListe + 4);
    const decal = portrait ? 56 : 42;
    ctx.fillStyle = fond;
    ctx.font = `700 ${tItem}px "Archivo", sans-serif`;
    ctx.fillText(tenir(ctx, t, lListe - decal), xListe + decal, yListe);
    yListe += portrait ? 48 : 40;
    if (!portrait && k < 3) { ctx.globalAlpha = 0.25; ctx.fillStyle = fond; ctx.fillRect(xListe, yListe - 12, lListe, 1); ctx.globalAlpha = 1; }
  });

  // Pied : « À lire et à écouter » et l'adresse en mono orange
  ctx.textBaseline = "alphabetic";
  if (portrait) {
    ctx.fillStyle = fond;
    ctx.font = '800 36px "Archivo", sans-serif';
    ctx.fillText("À lire et à écouter", pad, H - pad - 44);
    ctx.fillStyle = orange;
    ctx.font = '500 28px "IBM Plex Mono", monospace';
    ctx.fillText(ADRESSE_ONDE, pad, H - pad);
  } else {
    ctx.fillStyle = fond;
    ctx.fillRect(pad, H - 92, largeur, 3);
    ctx.font = '800 28px "Archivo", sans-serif';
    ctx.fillText("À lire et à écouter", pad, H - 42);
    ctx.fillStyle = orange;
    ctx.font = '500 22px "IBM Plex Mono", monospace';
    ctx.textAlign = "right";
    ctx.fillText(ADRESSE_ONDE, W - pad, H - 44);
    ctx.textAlign = "left";
  }

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("couverture"))), "image/png"));
}
