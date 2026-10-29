// Partage d'un événement : texte prêt à publier et vignettes (image) dessinées dans le navigateur.

export type InfoPartage = {
  titre: string;
  type: string; // libellé lisible : « Apéro écoute », « Atelier »…
  dateLong: string; // « Lundi 9 novembre 2026 »
  horaires: string; // « de 17h30 à 20h30 »
  lieu?: string | null;
  adresse?: string | null; // déjà nettoyée (sans code postal)
  ville?: string;
  enLigne?: boolean;
  tarif?: string | null;
  sousTitre?: string | null;
  url: string; // adresse publique de la page de l'événement
  image?: string | null;
  jeViens?: boolean;
};

/** Texte complet, prêt à coller dans un post LinkedIn, Facebook, WhatsApp ou un e-mail. */
/** « Atelier : Atelier-écoute » devient « Atelier-écoute » : pas de répétition du type. */
export const titrePartage = (e: InfoPartage) =>
  e.titre.toLocaleLowerCase("fr-FR").includes(e.type.toLocaleLowerCase("fr-FR")) ? e.titre : `${e.type} : ${e.titre}`;

export const textePartage = (e: InfoPartage) => {
  const lignes = [
    titrePartage(e),
    e.sousTitre ? e.sousTitre.replace(/\.$/, "") + "." : "",
    "",
    `Quand : ${e.dateLong}, ${e.horaires}`,
    e.enLigne ? "Où : en ligne" : `Où : ${[e.lieu, e.adresse && e.adresse !== e.lieu ? e.adresse : "", !e.adresse && e.ville ? e.ville : ""].filter(Boolean).join(", ")}`,
    `Entrée : ${e.tarif || "libre"}`,
    "",
    e.jeViens ? `Toutes les infos et « Je viens » : ${e.url}` : `Toutes les infos : ${e.url}`,
    "",
    "Les Podcasteur·euses du Sud",
  ];
  return lignes.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

/** Lien d'e-mail avec l'objet et le texte complet. */
export const mailtoPartage = (e: InfoPartage) =>
  `mailto:?subject=${encodeURIComponent(`${titrePartage(e)} — ${e.dateLong}`)}&body=${encodeURIComponent(textePartage(e))}`;

// ---------- Vignettes ----------

export type FormatVignette = "paysage" | "carre";
const TAILLES: Record<FormatVignette, [number, number]> = { paysage: [1200, 630], carre: [1080, 1080] };

const css = (v: string) => `hsl(${getComputedStyle(document.documentElement).getPropertyValue(v).trim()})`;

const chargerImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/** Coupe un texte en lignes qui tiennent dans la largeur, au plus `max` lignes (la dernière finit par « … »). */
const lignes = (ctx: CanvasRenderingContext2D, texte: string, largeur: number, max: number) => {
  const mots = texte.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const m of mots) {
    const essai = cur ? `${cur} ${m}` : m;
    if (ctx.measureText(essai).width <= largeur) cur = essai;
    else { if (cur) out.push(cur); cur = m; }
  }
  if (cur) out.push(cur);
  if (out.length > max) {
    const garde = out.slice(0, max);
    let last = garde[max - 1];
    while (ctx.measureText(`${last}…`).width > largeur && last.length > 1) last = last.slice(0, -1);
    garde[max - 1] = `${last}…`;
    return garde;
  }
  return out;
};

/** Image recadrée pour remplir un rectangle (comme une photo de couverture). */
const couvrir = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
  const r = Math.max(w / img.width, h / img.height);
  const sw = w / r, sh = h / r;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
};

/** Image entière centrée dans un rectangle (pour une affiche qui contient du texte). */
const contenir = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
  const r = Math.min(w / img.width, h / img.height);
  const dw = img.width * r, dh = img.height * r;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
};

/** Dessine la vignette de l'événement aux couleurs du site et renvoie l'image PNG. */
export async function dessinerVignette(e: InfoPartage, format: FormatVignette): Promise<Blob> {
  const [W, H] = TAILLES[format];
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  await Promise.all([
    document.fonts.load('900 64px "Archivo"'), document.fonts.load('700 32px "Archivo"'),
    document.fonts.load('500 24px "IBM Plex Mono"'),
  ]).catch(() => null);
  const bleu = css("--pds-bleu"), orange = css("--pds-orange"), encre = css("--pds-encre"), fond = css("--pds-fond");
  const [visuel, logo] = await Promise.all([e.image ? chargerImage(e.image) : Promise.resolve(null), chargerImage("/favicon.png")]);

  ctx.fillStyle = bleu; ctx.fillRect(0, 0, W, H);

  // Zone image : à droite (paysage) ou en haut (carré)
  const coupe = 600;
  const zone = format === "paysage" ? { x: coupe, y: 0, w: W - coupe, h: H } : { x: 0, y: 0, w: W, h: 470 };
  ctx.fillStyle = encre; ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  if (visuel) {
    // Proportions proches de la zone : on remplit ; sinon on montre l'image entière (une affiche contient du texte)
    const ecart = (visuel.width / visuel.height) / (zone.w / zone.h);
    if (ecart > 0.8 && ecart < 1.25) couvrir(ctx, visuel, zone.x, zone.y, zone.w, zone.h);
    else contenir(ctx, visuel, zone.x, zone.y, zone.w, zone.h);
  } else if (logo) {
    contenir(ctx, logo, zone.x + zone.w / 2 - 110, zone.y + zone.h / 2 - 110, 220, 220);
  }
  // Trait orange de séparation
  ctx.fillStyle = orange;
  if (format === "paysage") ctx.fillRect(coupe - 8, 0, 8, H); else ctx.fillRect(0, zone.h, W, 10);

  const pad = format === "paysage" ? 52 : 64;
  const largeur = format === "paysage" ? coupe - 8 - pad * 2 : W - pad * 2;
  let y = format === "paysage" ? 64 : zone.h + 10 + 64;

  // Petite ligne en capitales
  ctx.fillStyle = orange;
  ctx.font = '500 22px "IBM Plex Mono", monospace';
  ctx.textBaseline = "top";
  const kicker = `${e.type}${e.enLigne ? " · EN LIGNE" : e.ville ? ` · ${e.ville}` : ""}`.toLocaleUpperCase("fr-FR");
  ctx.fillText(kicker.split("").join(String.fromCharCode(8202)), pad, y);
  y += 44;

  // Titre
  ctx.fillStyle = "#ffffff";
  const tailleTitre = format === "paysage" ? 58 : 72;
  ctx.font = `900 ${tailleTitre}px "Archivo", sans-serif`;
  for (const l of lignes(ctx, e.titre, largeur, format === "paysage" ? 3 : 2)) { ctx.fillText(l, pad, y); y += tailleTitre * 1.04; }
  y += 18;

  // Date, horaires, lieu, tarif
  const infos = [
    `${e.dateLong}`,
    e.horaires.charAt(0).toLocaleUpperCase("fr-FR") + e.horaires.slice(1),
    e.enLigne ? "En ligne" : [e.lieu, e.adresse && e.adresse !== e.lieu ? e.adresse : ""].filter(Boolean).join(", "),
    e.tarif ? `Entrée : ${e.tarif}` : "Entrée libre",
  ].filter(Boolean);
  const tailleInfo = format === "paysage" ? 26 : 32;
  for (const [i, t] of infos.entries()) {
    ctx.font = `${i === 0 ? 800 : 500} ${tailleInfo}px "Archivo", sans-serif`;
    ctx.fillStyle = i === 0 ? "#ffffff" : fond;
    for (const l of lignes(ctx, t, largeur, 2)) { ctx.fillText(l, pad, y); y += tailleInfo * 1.3; }
  }

  // Pied : logo + site
  const piedY = H - (format === "paysage" ? 84 : 96);
  if (logo) ctx.drawImage(logo, pad, piedY, 48, 48);
  ctx.fillStyle = "#ffffff";
  ctx.font = '800 24px "Archivo", sans-serif';
  ctx.fillText("Les Podcasteur·euses du Sud", pad + 64, piedY + 2);
  ctx.fillStyle = orange;
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText(format === "carre" && e.jeViens ? "Infos et « Je viens » : les-podcasteur-euses-du-sud.fr/agenda" : "les-podcasteur-euses-du-sud.fr/agenda", pad + 64, piedY + 32);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("vignette"))), "image/png"));
}
