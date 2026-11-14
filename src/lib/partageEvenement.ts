// Partage d'un événement : texte prêt à publier et vignettes (image) dessinées dans le navigateur.

export type InfoPartage = {
  titre: string;
  type: string; // libellé lisible : « Apéro écoute », « Atelier »…
  dateLong: string; // « Lundi 9 novembre 2026 »
  horaires: string; // « de 18h30 à 21h30 »
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

// ---------- Instagram (admin → Agenda, « Créer le post Insta ») ----------
// Rien n'est publié automatiquement : l'équipe télécharge les visuels et copie la légende.

/** Même règle que la base (evenements_instagram) : « @compte », lettres minuscules, chiffres, points et tirets bas. */
export const normaliserInstagram = (v: string) => {
  let s = (v || "").trim().toLowerCase();
  s = s.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/[/?#].*$/, "");
  if (!s) return "";
  return s.startsWith("@") ? s : `@${s}`;
};
export const instagramValide = (compte: string) =>
  /^@[a-z0-9._]{1,30}$/.test(compte) && !/\.\./.test(compte) && !/^@\./.test(compte) && !/\.$/.test(compte);

export const LEGENDE_MAX = 2200;
export const MENTION_AGENDA = "À l'agenda des Podcasteur·euses du Sud";
export const SITE_COURT = "les-podcasteur-euses-du-sud.fr";

/** Rappel affiché sous la légende. */
export const rappelCollaborateur = (compte?: string | null) =>
  compte
    ? `Au moment de publier sur Instagram, invite ${compte} en collaborateur.`
    : "Au moment de publier sur Instagram, invite l'organisateur en collaborateur (son compte n'est pas renseigné dans l'événement).";

const TAG_TYPE: Record<string, string> = {
  apero_ecoute: "#ecoutecollective",
  ecoute: "#ecoutecollective",
  atelier: "#atelierpodcast",
  live: "#podcastlive",
  rencontre: "#rencontrepodcast",
};
const motDiese = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/** 4 à 6 mots-clés : création sonore, podcast, la ville (sinon Région Sud), le type, l'association. */
export const hashtagsInsta = (e: { typeCode?: string | null; ville?: string; enLigne?: boolean }) => {
  const ville = e.ville ? motDiese(e.ville) : "";
  const tags = ["#creationsonore", "#podcast", ville ? `#${ville}` : "#regionsud", e.typeCode ? TAG_TYPE[e.typeCode] : "", "#podcasteureusesdusud"];
  if (tags.filter(Boolean).length < 5) tags.push("#sudpodcast");
  return [...new Set(tags.filter(Boolean))].slice(0, 6);
};

export type InfoInsta = InfoPartage & {
  typeCode?: string | null;
  /** Description de l'événement (on en tire une phrase si le sous-titre est vide). */
  description?: string | null;
};

/** Ce que l'événement apporte côté création sonore : le sous-titre, sinon la première phrase de la description. */
export const phraseInsta = (e: Pick<InfoInsta, "sousTitre" | "description">) => {
  const propre = (t?: string | null) => (t || "").replace(/\s+/g, " ").trim();
  const st = propre(e.sousTitre);
  if (st) return st.replace(/[.!…]*$/, ".");
  const d = propre(e.description);
  if (d) {
    const m = /^(.{20,}?[.!?…])(\s|$)/.exec(d);
    const p = (m ? m[1] : d).slice(0, 400);
    return /[.!?…]$/.test(p) ? p : `${p}.`;
  }
  return "Un moment pour écouter et parler de création sonore ensemble.";
};

/** Légende prête à copier, au tutoiement, 2 200 caractères au plus. */
export const legendeInsta = (e: InfoInsta, compte?: string | null) => {
  const fin = [
    "",
    `Quand : ${e.dateLong}, ${e.horaires}`,
    e.enLigne ? "Où : en ligne" : `Où : ${[e.lieu, e.adresse && e.adresse !== e.lieu ? e.adresse : "", !e.adresse && e.ville ? e.ville : ""].filter(Boolean).join(", ") || "lieu à venir"}`,
    "",
    `Tu viens ? Toutes les infos : ${e.url}`,
    compte ? `Avec ${compte}` : "",
    "",
    hashtagsInsta(e).join(" "),
  ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
  const tete = `${titrePartage(e)}\n${phraseInsta(e)}\n`;
  const place = LEGENDE_MAX - fin.length - 1;
  const debut = tete.length <= place ? tete : `${tete.slice(0, Math.max(0, place - 1)).trimEnd()}…`;
  return `${debut}\n${fin}`.replace(/\n{3,}/g, "\n\n").trim().slice(0, LEGENDE_MAX);
};

export type FormatInsta = "post" | "story";
export const TAILLES_INSTA: Record<FormatInsta, [number, number]> = { post: [1080, 1350], story: [1080, 1920] };

/**
 * Visuel Instagram aux couleurs du site : fond bleu, filets encre et orange, Archivo + IBM Plex Mono, angles droits.
 * Avec photo : la photo en haut ; sans photo (ou photo de l'organisateur) : version typographique.
 */
export async function dessinerPostInsta(e: InfoPartage, format: FormatInsta, avecPhoto: boolean): Promise<Blob> {
  const [W, H] = TAILLES_INSTA[format];
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  await Promise.all([
    document.fonts.load('900 96px "Archivo"'), document.fonts.load('800 40px "Archivo"'), document.fonts.load('500 40px "Archivo"'),
    document.fonts.load('500 28px "IBM Plex Mono"'), document.fonts.load('700 28px "IBM Plex Mono"'),
  ]).catch(() => null);
  const bleu = css("--pds-bleu"), orange = css("--pds-orange"), encre = css("--pds-encre"), fond = css("--pds-fond");
  const [visuel, logo] = await Promise.all([avecPhoto && e.image ? chargerImage(e.image) : Promise.resolve(null), chargerImage("/favicon.png")]);
  const story = format === "story";
  const pad = 72;
  const largeur = W - pad * 2;
  // Zones sûres de la story (barres d'Instagram en haut et en bas)
  const haut = story ? 200 : 0;
  const bas = story ? 260 : 0;

  ctx.fillStyle = bleu; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "top";
  const espace = (t: string) => t.split("").join(String.fromCharCode(8202));
  let y: number;

  if (visuel) {
    const zoneH = story ? 660 : 600;
    const zy = haut;
    ctx.fillStyle = encre; ctx.fillRect(0, zy, W, zoneH);
    const ecart = (visuel.width / visuel.height) / (W / zoneH);
    if (ecart > 0.75 && ecart < 1.33) couvrir(ctx, visuel, 0, zy, W, zoneH); else contenir(ctx, visuel, 0, zy, W, zoneH);
    ctx.fillStyle = encre; ctx.fillRect(0, zy + zoneH, W, 6);
    ctx.fillStyle = orange; ctx.fillRect(0, zy + zoneH + 6, W, 12);
    y = zy + zoneH + 18 + 52;
  } else {
    // Version typographique : grand bloc date en orange, filets
    y = haut + (story ? 110 : 84);
    ctx.fillStyle = orange;
    ctx.font = '700 28px "IBM Plex Mono", monospace';
    ctx.fillText(espace(`${e.type}${e.enLigne ? " · EN LIGNE" : e.ville ? ` · ${e.ville}` : ""}`.toLocaleUpperCase("fr-FR")), pad, y);
    y += 64;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(pad, y, largeur, 4);
    y += 40;
    const tailleDate = story ? 112 : 96;
    ctx.fillStyle = orange;
    ctx.font = `900 ${tailleDate}px "Archivo", sans-serif`;
    for (const l of lignes(ctx, e.dateLong, largeur, 3)) { ctx.fillText(l, pad, y); y += tailleDate * 1.0; }
    y += 36;
  }

  if (visuel) {
    ctx.fillStyle = orange;
    ctx.font = '700 26px "IBM Plex Mono", monospace';
    ctx.fillText(espace(`${e.type}${e.enLigne ? " · EN LIGNE" : e.ville ? ` · ${e.ville}` : ""}`.toLocaleUpperCase("fr-FR")), pad, y);
    y += 56;
  }

  // Titre
  const tailleTitre = visuel ? (story ? 80 : 72) : (story ? 108 : 92);
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${tailleTitre}px "Archivo", sans-serif`;
  const maxTitre = visuel ? (story ? 4 : 3) : (story ? 6 : 4);
  for (const l of lignes(ctx, e.titre, largeur, maxTitre)) { ctx.fillText(l, pad, y); y += tailleTitre * 1.02; }
  y += 30;

  // Infos : date (si photo), horaires, lieu
  const infos = [
    visuel ? e.dateLong : "",
    e.horaires.charAt(0).toLocaleUpperCase("fr-FR") + e.horaires.slice(1),
    e.enLigne ? "En ligne" : [e.lieu, e.adresse && e.adresse !== e.lieu ? e.adresse : e.ville || ""].filter(Boolean).join(", "),
  ].filter(Boolean);
  const tailleInfo = story ? 42 : 38;
  const piedY = H - bas - 200;
  for (const [i, t] of infos.entries()) {
    ctx.font = `${i === 0 && visuel ? 800 : 500} ${tailleInfo}px "Archivo", sans-serif`;
    ctx.fillStyle = i === 0 && visuel ? "#ffffff" : fond;
    for (const l of lignes(ctx, t, largeur, 2)) {
      if (y + tailleInfo > piedY - 30) break;
      ctx.fillText(l, pad, y); y += tailleInfo * 1.28;
    }
  }

  // Pied : filet, mention de l'agenda, logo et adresse du site
  ctx.fillStyle = "#ffffff"; ctx.fillRect(pad, piedY, largeur, 4);
  ctx.fillStyle = "#ffffff";
  ctx.font = '800 34px "Archivo", sans-serif';
  if (logo) ctx.drawImage(logo, pad, piedY + 40, 72, 72);
  ctx.fillText(MENTION_AGENDA, pad + 96, piedY + 40);
  ctx.fillStyle = orange;
  ctx.font = '500 28px "IBM Plex Mono", monospace';
  ctx.fillText(`${SITE_COURT}/agenda`, pad + 96, piedY + 94);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("visuel"))), "image/png"));
}
