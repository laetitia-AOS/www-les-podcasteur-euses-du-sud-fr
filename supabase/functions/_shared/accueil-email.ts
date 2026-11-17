// Relance (une seule, 7 jours après la bienvenue) et invitation de rattrapage au groupe WhatsApp du département.
// Envoyées par Resend (envoi groupé, limite du jour de l'offre), au « tu », mise en page en tableaux de 600 px.
// Chaque message porte un lien « Ne plus recevoir de relance » (jeton personnel) et l'en-tête List-Unsubscribe.
import { CONTACT_ACCUEIL, INSTAGRAM_PDS, LINKEDIN_PDS, SITE_ACCUEIL, plagesQr } from "./accueil.ts";
import { matriceQr } from "./accueil-qr.ts";
import type { DonneesAccueil } from "./accueil-donnees.ts";

export const ACCUEIL_EXPEDITEUR = "Les Podcasteur·euses du Sud <bonjour@les-podcasteur-euses-du-sud.fr>";
export const ACCUEIL_REPONSE = CONTACT_ACCUEIL;
export type TypeAccueil = "relance" | "invitation";

const BLEU = "#1530B8", ORANGE = "#F28C28", ENCRE = "#0F0F12", FOND = "#F3F2EE", GRIS = "#4A4A52";
const SANS = "Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', 'Courier New', Courier, monospace";

export const echapper = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const p = (html: string, style = "") => `<p style="font-family:${SANS};font-size:16px;line-height:1.6;color:${GRIS};margin:0 0 16px;${style}">${html}</p>`;
const h2 = (t: string) => `<p style="font-family:${SANS};font-size:20px;font-weight:900;text-transform:uppercase;color:${ENCRE};margin:28px 0 10px;line-height:1.15">${echapper(t)}</p>`;
const a = (href: string, t: string) => `<a href="${echapper(href)}" style="color:${BLEU};text-decoration:underline">${echapper(t)}</a>`;
const bouton = (href: string, t: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px"><tr><td style="background-color:${BLEU};border:2px solid ${BLEU}">` +
  `<a href="${echapper(href)}" style="display:inline-block;padding:15px 24px;font-family:${SANS};font-size:16px;font-weight:800;color:#ffffff;text-decoration:none">${echapper(t)}</a></td></tr></table>`;

export const qrHtml = (lien: string, taille = 5): string => {
  let m: boolean[][];
  try { m = matriceQr(lien); } catch { return ""; }
  const n = m.length;
  const cols = m[0].map(() => `<col width="${taille}">`).join("");
  const lignes = plagesQr(m).map((r) => `<tr style="height:${taille}px">${r.map((x) =>
    x.noir ? `<td colspan="${x.n}" style="background-color:${ENCRE}"></td>` : `<td colspan="${x.n}"></td>`).join("")}</tr>`).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${n * taille}" style="border-collapse:collapse;table-layout:fixed;width:${n * taille}px;font-size:1px;line-height:1px;background-color:#ffffff;border:2px solid ${ENCRE}"><colgroup>${cols}</colgroup><tbody>${lignes}</tbody></table>`;
};

export function emailAccueil(d: DonneesAccueil, type: TypeAccueil): { objet: string; html: string; texte: string } {
  const bonjour = d.prenom ? `Bonjour ${d.prenom},` : "Bonjour,";
  const objet = type === "relance"
    ? (d.groupe ? `Le groupe ${d.groupe.nom} t'attend` : "Le groupe WhatsApp de ton département t'attend")
    : "Rejoins le groupe WhatsApp de ton département";
  const intro = type === "relance"
    ? "La semaine dernière, on t'a écrit pour t'accueillir chez les Podcasteur·euses du Sud. Si ce n'est pas encore fait, voici le groupe WhatsApp de ton département : c'est là que circulent les ateliers d'écoute, les appels à création et les propositions du moment."
    : "Le collectif a maintenant un groupe WhatsApp par département. C'est là que circulent les ateliers d'écoute, les appels à création, les passages radio avec Maritima et les propositions du moment. Être membre, c'est aussi s'y retrouver.";

  const groupeHtml = d.groupe
    ? p(`Le groupe de ton département : <strong style="color:${ENCRE}">${echapper(d.groupe.nom)}</strong>.`) +
      bouton(d.groupe.lien, `Rejoindre le groupe ${d.groupe.nom}`) +
      `<p style="font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#77777F;margin:18px 0 8px">Ou scanne ce QR code avec ton téléphone</p>` +
      qrHtml(d.groupe.lien)
    : p(`On ne connaît pas encore ton département : ${a(d.lienEspace, "indique-le dans ton espace membre")}. En attendant, la règle : <strong style="color:${ENCRE}">${echapper(d.regle)}</strong>.`) +
      d.groupes.map((g) => bouton(g.lien, `Rejoindre le groupe ${g.nom}`)).join("");

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${echapper(objet)}</title></head>
<body style="margin:0;padding:24px 0;background-color:#ffffff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
<tr><td style="background-color:${BLEU};padding:22px 28px">
<p style="font-family:${SANS};font-size:19px;font-weight:900;color:#ffffff;margin:0;line-height:1.1">Les Podcasteur·euses du Sud</p>
<p style="font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#FFD9B0;margin:4px 0 0">Podcast · audio · Région Sud</p>
</td></tr>
<tr><td style="height:8px;line-height:8px;font-size:1px;background-color:${ORANGE}">&nbsp;</td></tr>
<tr><td style="padding:32px 28px 10px;border:2px solid ${ENCRE};border-top:none">
<p style="font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${BLEU};margin:0 0 10px">Groupe WhatsApp</p>
<p style="font-family:${SANS};font-size:32px;line-height:1.05;font-weight:900;color:${ENCRE};margin:0 0 22px">${echapper(objet)}</p>
${p(echapper(bonjour))}
${p(echapper(intro))}
${groupeHtml}
${p(`C'est fait ? ${a(d.lienRejoint, "Dis-nous que tu as rejoint le groupe")} : on ne t'en reparlera plus.`, "margin-top:18px")}
${h2("Ton message de présentation")}
${p("Copie-le, complète ce qui est entre crochets, et envoie-le dans le groupe :")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr><td style="background-color:${FOND};border-left:6px solid ${ORANGE};padding:16px 18px;font-family:${SANS};font-size:16px;line-height:1.6;color:${ENCRE}">${echapper(d.presentation)}</td></tr></table>
${d.atelier ? p(`Prochain atelier d'écoute : ${a(d.atelier.href, d.atelier.date)}${d.atelier.lieu ? `, ${echapper(d.atelier.lieu)}` : ""}.`) : ""}
${p(`Une question ? ${a(`mailto:${CONTACT_ACCUEIL}`, CONTACT_ACCUEIL)} · ${a(INSTAGRAM_PDS, "Instagram")} · ${a(LINKEDIN_PDS, "LinkedIn")}`, "font-size:14px")}
<p style="font-family:${SANS};font-size:16px;color:${ENCRE};margin:24px 0 26px;line-height:1.5">À très vite,<br><strong>L'équipe des Podcasteur·euses du Sud</strong></p>
</td></tr>
<tr><td style="padding:18px 28px"><p style="font-family:${MONO};font-size:11px;color:#77777F;margin:0;line-height:1.6">
Tu reçois ce message parce que tu fais partie des Podcasteur·euses du Sud.<br>
${d.lienStop ? `${a(d.lienStop, "Ne plus recevoir de relance pour le groupe WhatsApp")}<br>` : ""}
${a(SITE_ACCUEIL, "les-podcasteur-euses-du-sud.fr")}</p></td></tr>
</table></td></tr></table></body></html>`;

  const lignesGroupe = d.groupe
    ? [`Le groupe de ton département : ${d.groupe.nom}`, `Rejoindre le groupe : ${d.groupe.lien}`]
    : [`On ne connaît pas encore ton département : indique-le dans ton espace membre (${d.lienEspace}).`, `La règle : ${d.regle}.`, ...d.groupes.map((g) => `Rejoindre le groupe ${g.nom} : ${g.lien}`)];
  const texte = [
    objet.toUpperCase(), "", bonjour, "", intro, "", ...lignesGroupe, "",
    `C'est fait ? Dis-nous que tu as rejoint le groupe : ${d.lienRejoint}`, "",
    "TON MESSAGE DE PRÉSENTATION (à copier, complète ce qui est entre crochets) :", d.presentation, "",
    ...(d.atelier ? [`Prochain atelier d'écoute : ${d.atelier.date}${d.atelier.lieu ? `, ${d.atelier.lieu}` : ""} — ${d.atelier.href}`, ""] : []),
    `Une question ? ${CONTACT_ACCUEIL}`, `Instagram : ${INSTAGRAM_PDS}`, `LinkedIn : ${LINKEDIN_PDS}`, "",
    "À très vite,", "L'équipe des Podcasteur·euses du Sud", "",
    "Tu reçois ce message parce que tu fais partie des Podcasteur·euses du Sud.",
    ...(d.lienStop ? [`Ne plus recevoir de relance pour le groupe WhatsApp : ${d.lienStop}`] : []),
  ].join("\n");
  return { objet, html, texte };
}
