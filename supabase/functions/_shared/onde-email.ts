// L'Onde du Sud : construction des e-mails (numéro du mois et confirmation d'inscription).
// Module sans dépendance : utilisé par les fonctions serveur (Deno) et par les tests du site (Vitest).
// Mise en page pour les messageries : tableaux, 600 px, styles en ligne, texte lisible sans images, version texte brut.

export const SITE = "https://www.les-podcasteur-euses-du-sud.fr";
export const ONDE_EXPEDITEUR = "L'Onde du Sud <onde@les-podcasteur-euses-du-sud.fr>";
export const ONDE_REPONSE = "podcastsdusud@gmail.com";
/** Adresse de l'association qui reçoit la copie « [À transférer] » à chaque envoi réel. */
export const ONDE_COPIE = "podcastsdusud@gmail.com";
export const LIEN_INSCRIPTION = `${SITE}/onde#recevoir`;
export const PHRASE_ABONNE = "Tu reçois cette lettre parce que tu es membre ou inscrit·e à L'Onde du Sud";
export const PHRASE_STOP = "Tu ne veux plus la recevoir ? Réponds STOP à ce message.";

const C = { bleu: "#1530B8", orange: "#F28C28", encre: "#0F0F12", fond: "#F3F2EE", filet: "#C9C7BF", blanc: "#FFFFFF", gris: "#55555C" };
const POLICE = "Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', 'Courier New', Courier, monospace";
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// ——— Types (mêmes champs que les numéros enregistrés en base) ———

export type Chiffre = { valeur: string; libelle: string };
export type BlocEmail = {
  id: string;
  type: string;
  rubrique?: string;
  resume?: string;
  titre?: string;
  texte?: string;
  images?: { url: string; alt?: string }[];
  url?: string;
  podcast?: string;
  createur?: string;
  libelle?: string;
  lien?: string;
  chiffres?: Chiffre[];
  evenements?: string[];
  podcast_id?: string;
};
export type NumeroEmail = {
  id: string;
  numero: number;
  mois: string;
  titre: string;
  chapeau: string;
  slug: string;
  couverture_url: string | null;
  couverture_alt: string | null;
  audio_url: string | null;
  audio_duree?: number | null;
  blocs: BlocEmail[];
};
export type EvenementEmail = { id: string; titre: string; date_debut: string; lieu?: string | null; slug?: string | null };
export type PodcastEmail = { id: string; slug?: string | null; nom_podcast?: string | null; prenom?: string | null; nom?: string | null; type_profil?: string | null };
export type MembreEmail = PodcastEmail & { photo_url?: string | null };
export type ContexteEmail = {
  evenements: EvenementEmail[];
  podcasts: PodcastEmail[];
  /** Nouveaux membres par identifiant de bloc. */
  membres: Record<string, MembreEmail[]>;
};
/** abonne / test : lien de désinscription personnel ; copie : lien d'inscription et « Réponds STOP ». */
export type ModeEmail = { type: "abonne" | "test"; lienDesinscription: string } | { type: "copie" };
export type EmailConstruit = { objet: string; html: string; texte: string };

// ——— Petits outils ———

export const esc = (s: string | null | undefined) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Texte mis en forme (**gras**, *italique*, [lien](url)) ramené à du texte simple. */
export const texteSimple = (t: string | null | undefined) =>
  String(t ?? "")
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, "$1")
    .replace(/\*\*([^*\n]+?)\*\*/g, "$1")
    .replace(/\*([^*\n]+?)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

/** Coupe proprement à « max » caractères, entre deux mots, avec « … ». */
export const couper = (t: string, max = 220) => {
  const s = t.trim();
  if (s.length <= max) return s;
  const c = s.slice(0, max);
  const i = c.lastIndexOf(" ");
  return `${(i > max * 0.6 ? c.slice(0, i) : c).replace(/[\s,;:.–—-]+$/, "")}…`;
};

const PARTICULES = new Set(["de", "du", "des", "et", "d", "van", "von", "da", "di"]);
/** Même règle que formatName du site : majuscule à chaque mot, petites particules au milieu. */
export const formatNom = (s?: string | null) =>
  !s ? "" : s.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr-FR").replace(/(^|[\s\-'’])(\p{L}+)/gu, (_m, sep: string, mot: string, offset: number) =>
    offset > 0 && sep === " " && PARTICULES.has(mot) ? sep + mot
    : offset > 0 && /['’]/.test(sep) && mot.length === 1 ? sep + mot
    : sep + mot.charAt(0).toLocaleUpperCase("fr-FR") + mot.slice(1));
const nomComplet = (p: { prenom?: string | null; nom?: string | null }) => [formatNom(p.prenom), formatNom(p.nom)].filter(Boolean).join(" ");
const titreFiche = (p: PodcastEmail) => {
  const t = (p.nom_podcast || "").trim();
  return t && !/^[—–\-.\s]+$/.test(t) ? t : nomComplet(p) || "Sans titre";
};
const ficheHref = (p: PodcastEmail) => {
  const id = p.slug || p.id;
  if (p.type_profil === "studio") return `/studios/${id}`;
  if (p.type_profil === "structure_eco") return `/structures/${id}`;
  if (p.type_profil === "podcasteur" && (p.nom_podcast || "").trim() && !/^[—–\-.\s]+$/.test(p.nom_podcast || "")) return `/ecouter/${id}`;
  return `/annuaire/${id}`;
};

const moisAnnee = (mois: string) => {
  const r = /^(\d{4})-(\d{2})/.exec(mois || "");
  return r ? `${MOIS[Number(r[2]) - 1]} ${r[1]}` : "";
};
export const etiquette = (i: number) => String(i + 1).padStart(2, "0");

/** Lien du site avec la provenance « L'Onde du Sud », pour le rapport de la semaine. */
export const lienSite = (href: string, numero: number) => {
  const abs = href.startsWith("/") ? `${SITE}${href}` : href;
  if (!abs.startsWith(SITE)) return abs;
  const [base, ancre] = abs.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}utm_source=onde-du-sud&utm_medium=email&utm_campaign=n${numero}${ancre ? `#${ancre}` : ""}`;
};
const lienSur = (h?: string | null) => !!h && (/^https?:\/\/[^\s<>"]+$/i.test(h) || /^\/(?!\/)[^\s<>"]*$/.test(h));

/** « sam. 12 déc. · 18h30 », heure de Paris. */
export const dateCourte = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const jour = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", "h");
  return `${jour} · ${heure}`;
};

/** « Écouter ce numéro (12 min) » ; sans version audio : « Lire ce numéro ». */
export const libelleEcoute = (n: Pick<NumeroEmail, "audio_url" | "audio_duree">) => {
  if (!n.audio_url) return "Lire ce numéro";
  if (!n.audio_duree || n.audio_duree < 1) return "Écouter ce numéro";
  return `Écouter ce numéro (${Math.max(1, Math.round(n.audio_duree / 60))} min)`;
};

export const objetNumero = (n: Pick<NumeroEmail, "titre" | "numero">) => `${n.titre.trim()} — L'Onde du Sud n°${n.numero}`;

/** Résumé d'un bloc pour l'e-mail : le champ « Résumé pour l'e-mail », sinon le début du texte du bloc. */
export const resumeBloc = (b: BlocEmail, podcasts: PodcastEmail[] = []): string => {
  const propre = texteSimple(b.resume);
  if (propre) return couper(propre, 300);
  switch (b.type) {
    case "texte":
    case "trimestre":
    case "podcast":
      return couper(texteSimple(b.texte));
    case "audio": {
      const t = (b.titre || "").trim();
      return t ? `Un extrait à écouter : « ${t} »${b.podcast ? `, ${b.podcast.trim()}` : ""}.` : "Un extrait à écouter sur le site.";
    }
    case "images": {
      const n = (b.images || []).length;
      const alt = texteSimple(b.images?.[0]?.alt);
      return alt ? couper(alt) : n > 1 ? `${n} photos à voir sur le site.` : "Une photo à voir sur le site.";
    }
    default:
      return "";
  }
};

// ——— Morceaux de mise en page ———

const bouton = (href: string, libelle: string, fond: string, texte: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
<td bgcolor="${fond}" style="background:${fond};border:2px solid ${C.encre};">
<a href="${esc(href)}" style="display:inline-block;padding:13px 22px;font-family:${POLICE};font-size:16px;font-weight:700;line-height:20px;color:${texte};text-decoration:none;">${esc(libelle)}</a>
</td></tr></table>`;

const etiquetteHtml = (i: number, rubrique: string) =>
  `<p style="margin:0 0 6px 0;font-family:${MONO};font-size:12px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:${C.bleu};font-weight:700;">${etiquette(i)} — ${esc(rubrique)}</p>`;

const paragraphe = (t: string) =>
  t ? `<p style="margin:0;font-family:${POLICE};font-size:16px;line-height:24px;color:${C.encre};">${esc(t)}</p>` : "";

const chiffresHtml = (cs: Chiffre[]) => {
  const ok = cs.filter((c) => c.valeur?.trim() && c.libelle?.trim());
  if (!ok.length) return "";
  return `<p style="margin:8px 0 0 0;font-family:${POLICE};font-size:16px;line-height:26px;color:${C.encre};">${ok
    .map((c) => `<strong style="font-family:${MONO};font-size:18px;color:${C.bleu};">${esc(c.valeur.trim())}</strong>&nbsp;${esc(c.libelle.trim())}`)
    .join(`<span style="color:${C.filet};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`)}</p>`;
};
const chiffresTexte = (cs: Chiffre[]) => cs.filter((c) => c.valeur?.trim() && c.libelle?.trim()).map((c) => `${c.valeur.trim()} ${c.libelle.trim()}`).join(" · ");

const initiales = (m: MembreEmail) => (formatNom(m.prenom).charAt(0) + formatNom(m.nom).charAt(0)).toUpperCase() || "·";

const vignettesHtml = (ms: MembreEmail[], numero: number) => {
  const lignes: MembreEmail[][] = [];
  for (let i = 0; i < ms.length; i += 3) lignes.push(ms.slice(i, i + 3));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:10px;">${lignes
    .map((l) => `<tr>${l
      .map((m) => {
        const nom = nomComplet(m) || titreFiche(m);
        const href = lienSite(ficheHref(m), numero);
        const visuel = m.photo_url
          ? `<img src="${esc(m.photo_url)}" width="72" height="72" alt="${esc(nom)}" style="display:block;width:72px;height:72px;object-fit:cover;border:2px solid ${C.encre};">`
          : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="72" height="72" align="center" valign="middle" bgcolor="${C.bleu}" style="width:72px;height:72px;background:${C.bleu};border:2px solid ${C.encre};font-family:${MONO};font-size:22px;font-weight:700;color:${C.blanc};">${esc(initiales(m))}</td></tr></table>`;
        const podcast = (m.nom_podcast || "").trim() && !/^[—–\-.\s]+$/.test(m.nom_podcast || "") ? `<br><span style="font-weight:400;color:${C.gris};">${esc(m.nom_podcast!.trim())}</span>` : "";
        return `<td width="33%" valign="top" style="padding:8px 8px 8px 0;"><a href="${esc(href)}" style="text-decoration:none;color:${C.encre};">${visuel}</a>
<p style="margin:6px 0 0 0;font-family:${POLICE};font-size:14px;line-height:18px;font-weight:700;"><a href="${esc(href)}" style="color:${C.encre};text-decoration:underline;">${esc(nom)}</a>${podcast}</p></td>`;
      })
      .join("")}${"<td width=\"33%\"></td>".repeat(3 - l.length)}</tr>`)
    .join("")}</table>`;
};

const evenementsHtml = (evs: EvenementEmail[], numero: number) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:6px;">${evs
    .map((e) => {
      const href = lienSite(e.slug ? `/agenda/${e.slug}` : "/agenda", numero);
      return `<tr><td style="padding:8px 0;border-top:1px solid ${C.filet};font-family:${POLICE};font-size:15px;line-height:22px;color:${C.encre};">
<span style="font-family:${MONO};font-size:13px;color:${C.bleu};font-weight:700;">${esc(dateCourte(e.date_debut))}</span><br>
<a href="${esc(href)}" style="color:${C.encre};font-weight:700;text-decoration:underline;">${esc(e.titre)}</a>${e.lieu ? `<span style="color:${C.gris};"> — ${esc(e.lieu)}</span>` : ""}</td></tr>`;
    })
    .join("")}</table>`;

// ——— E-mail d'un numéro ———

type Rendu = { html: string; texte: string } | null;

const rendreBloc = (b: BlocEmail, i: number, n: NumeroEmail, ctx: ContexteEmail): Rendu => {
  const rubrique = (b.rubrique || "").trim();
  const resume = resumeBloc(b, ctx.podcasts);
  const tete = etiquetteHtml(i, rubrique);
  const teteTexte = `${etiquette(i)} — ${rubrique.toUpperCase()}`;
  const titre = (b.titre || "").trim();
  const titreHtml = titre && (b.type === "texte" || b.type === "trimestre")
    ? `<p style="margin:0 0 6px 0;font-family:${POLICE};font-size:19px;line-height:24px;font-weight:800;color:${C.encre};">${esc(titre)}</p>` : "";
  const corps: string[] = [];
  const texte: string[] = [teteTexte];
  if (titreHtml) { corps.push(titreHtml); texte.push(titre); }

  if (b.type === "evenements") {
    const evs = (b.evenements || []).map((id) => ctx.evenements.find((e) => e.id === id)).filter((e): e is EvenementEmail => !!e)
      .sort((a, z) => a.date_debut.localeCompare(z.date_debut));
    if (!evs.length) return null;
    if (resume) { corps.push(paragraphe(resume)); texte.push(resume); }
    corps.push(evenementsHtml(evs, n.numero));
    evs.forEach((e) => texte.push(`- ${dateCourte(e.date_debut)} : ${e.titre}${e.lieu ? ` — ${e.lieu}` : ""}\n  ${lienSite(e.slug ? `/agenda/${e.slug}` : "/agenda", n.numero)}`));
  } else if (b.type === "nouveaux_membres") {
    const ms = ctx.membres[b.id] || [];
    if (!ms.length) return null;
    if (resume) { corps.push(paragraphe(resume)); texte.push(resume); }
    corps.push(vignettesHtml(ms, n.numero));
    texte.push(ms.map((m) => `- ${nomComplet(m) || titreFiche(m)}${(m.nom_podcast || "").trim() && !/^[—–\-.\s]+$/.test(m.nom_podcast || "") ? ` (${m.nom_podcast!.trim()})` : ""}`).join("\n"));
  } else if (b.type === "chiffres") {
    if (resume) { corps.push(paragraphe(resume)); texte.push(resume); }
    const ch = chiffresHtml(b.chiffres || []);
    if (!ch && !resume) return null;
    corps.push(ch);
    texte.push(chiffresTexte(b.chiffres || []));
  } else if (b.type === "trimestre") {
    if (resume) { corps.push(paragraphe(resume)); texte.push(resume); }
    corps.push(chiffresHtml(b.chiffres || []));
    texte.push(chiffresTexte(b.chiffres || []));
  } else if (b.type === "podcast") {
    const p = ctx.podcasts.find((x) => x.id === b.podcast_id);
    if (p) {
      const href = lienSite(ficheHref(p), n.numero);
      corps.push(`<p style="margin:0 0 6px 0;font-family:${POLICE};font-size:19px;line-height:24px;font-weight:800;"><a href="${esc(href)}" style="color:${C.encre};text-decoration:underline;">${esc(titreFiche(p))}</a></p>`);
      texte.push(`${titreFiche(p)} — ${href}`);
    }
    if (resume) { corps.push(paragraphe(resume)); texte.push(resume); }
  } else if (b.type === "bouton") {
    if (resume) { corps.push(paragraphe(resume)); texte.push(resume); }
    if (b.libelle?.trim() && lienSur(b.lien)) {
      const href = lienSite(b.lien!.trim(), n.numero);
      corps.push(`<div style="height:10px;line-height:10px;font-size:10px;">&nbsp;</div>${bouton(href, b.libelle.trim(), C.blanc, C.encre)}`);
      texte.push(`${b.libelle.trim()} : ${href}`);
    }
  } else {
    if (!resume) return null;
    corps.push(paragraphe(resume));
    texte.push(resume);
  }
  const contenu = corps.filter(Boolean).join("");
  if (!contenu) return null;
  return {
    html: `<tr><td class="marge" style="padding:22px 32px 0 32px;"><div style="border-top:2px solid ${C.encre};padding-top:14px;">${tete}${contenu}</div></td></tr>`,
    texte: texte.filter(Boolean).join("\n"),
  };
};

export const emailNumero = (n: NumeroEmail, ctx: ContexteEmail, mode: ModeEmail): EmailConstruit => {
  const base = objetNumero(n);
  const objet = mode.type === "copie" ? `[À transférer] ${base}` : mode.type === "test" ? `[Test] ${base}` : base;
  const page = lienSite(`/onde/${n.slug}`, n.numero);
  const ecoute = libelleEcoute(n);
  const quand = `n°${n.numero} · ${moisAnnee(n.mois)}`;
  const blocs = n.blocs.map((b, i) => rendreBloc(b, i, n, ctx)).filter((r): r is NonNullable<Rendu> => !!r);

  const piedHtml = mode.type === "copie"
    ? `<p style="margin:0 0 10px 0;"><a href="${esc(lienSite(LIEN_INSCRIPTION, n.numero))}" style="color:${C.bleu};font-weight:700;text-decoration:underline;">Recevoir L'Onde du Sud chaque mois</a></p>
<p style="margin:0;">${esc(PHRASE_STOP)}</p>`
    : `<p style="margin:0 0 10px 0;">${esc(PHRASE_ABONNE)}.</p>
<p style="margin:0;"><a href="${esc(mode.lienDesinscription)}" style="color:${C.encre};text-decoration:underline;">Se désinscrire</a></p>`;
  const piedTexte = mode.type === "copie"
    ? `Recevoir L'Onde du Sud chaque mois : ${lienSite(LIEN_INSCRIPTION, n.numero)}\n${PHRASE_STOP}`
    : `${PHRASE_ABONNE}.\nSe désinscrire : ${mode.lienDesinscription}`;

  const couverture = n.couverture_url
    ? `<tr><td style="padding:0;"><a href="${esc(page)}"><img src="${esc(n.couverture_url)}" width="600" alt="${esc(n.couverture_alt || n.titre)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></a></td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(objet)}</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;800&family=IBM+Plex+Mono:wght@700&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; }
  a { color:${C.bleu}; }
  @media (max-width:620px) { .cadre { width:100% !important; } .marge { padding-left:20px !important; padding-right:20px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:${C.fond};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.fond};">${esc(n.chapeau)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.fond}" style="background:${C.fond};border-collapse:collapse;">
<tr><td align="center" style="padding:24px 10px;">
<table role="presentation" class="cadre" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.blanc}" style="width:600px;max-width:600px;background:${C.blanc};border:2px solid ${C.encre};border-collapse:collapse;">
<tr><td class="marge" style="padding:20px 32px;border-bottom:2px solid ${C.encre};">
<p style="margin:0;font-family:${POLICE};font-size:24px;line-height:28px;font-weight:800;letter-spacing:-0.5px;color:${C.encre};">L'Onde du Sud<span style="color:${C.orange};">.</span></p>
<p style="margin:4px 0 0 0;font-family:${MONO};font-size:12px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:${C.gris};">${esc(quand)} · La lettre des Podcasteur·euses du Sud</p>
</td></tr>
${couverture}
<tr><td class="marge" style="padding:26px 32px 0 32px;">
<h1 style="margin:0;font-family:${POLICE};font-size:30px;line-height:34px;font-weight:800;letter-spacing:-0.5px;color:${C.encre};">${esc(n.titre)}</h1>
<p style="margin:12px 0 0 0;font-family:${POLICE};font-size:18px;line-height:26px;color:${C.encre};">${esc(n.chapeau)}</p>
<div style="height:18px;line-height:18px;font-size:18px;">&nbsp;</div>
${bouton(page, ecoute, C.orange, C.encre)}
</td></tr>
${blocs.map((b) => b.html).join("\n")}
<tr><td class="marge" style="padding:30px 32px 32px 32px;">
${bouton(page, "Lire et écouter le numéro complet", C.bleu, C.blanc)}
</td></tr>
<tr><td class="marge" bgcolor="${C.fond}" style="padding:20px 32px;background:${C.fond};border-top:2px solid ${C.encre};font-family:${POLICE};font-size:13px;line-height:19px;color:${C.gris};">
${piedHtml}
<p style="margin:12px 0 0 0;">Les Podcasteur·euses du Sud · <a href="${esc(lienSite("/", n.numero))}" style="color:${C.gris};text-decoration:underline;">les-podcasteur-euses-du-sud.fr</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const texte = [
    `L'ONDE DU SUD — ${quand}`,
    "",
    n.titre,
    "",
    n.chapeau,
    "",
    `${ecoute} : ${page}`,
    ...blocs.flatMap((b) => ["", b.texte]),
    "",
    `Lire et écouter le numéro complet : ${page}`,
    "",
    "—",
    piedTexte,
    "Les Podcasteur·euses du Sud — " + SITE,
  ].join("\n");

  return { objet, html, texte };
};

// ——— E-mail de confirmation d'inscription ———

// Formulaire public : le prénom saisi n'est jamais recopié (personne ne peut faire écrire un texte à sa guise à une autre adresse).
export const emailConfirmation = (lien: string): EmailConstruit => {
  const bonjour = "Bonjour,";
  const objet = "Confirme ton inscription à L'Onde du Sud";
  const l1 = "Tu as demandé à recevoir L'Onde du Sud, la lettre mensuelle des Podcasteur·euses du Sud. Merci !";
  const l2 = "Un clic sur le bouton ci-dessous et c'est fait : le prochain numéro arrivera dans ta boîte mail.";
  const l3 = "Tu n'as rien demandé ? Ignore simplement ce message, tu ne recevras rien.";
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(objet)}</title></head>
<body style="margin:0;padding:0;background:${C.fond};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.fond}" style="background:${C.fond};"><tr><td align="center" style="padding:24px 10px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.blanc}" style="width:600px;max-width:100%;background:${C.blanc};border:2px solid ${C.encre};">
<tr><td style="padding:20px 32px;border-bottom:2px solid ${C.encre};"><p style="margin:0;font-family:${POLICE};font-size:24px;line-height:28px;font-weight:800;color:${C.encre};">L'Onde du Sud<span style="color:${C.orange};">.</span></p></td></tr>
<tr><td style="padding:26px 32px 32px 32px;font-family:${POLICE};font-size:17px;line-height:26px;color:${C.encre};">
<p style="margin:0 0 14px 0;">${esc(bonjour)}</p>
<p style="margin:0 0 14px 0;">${esc(l1)}</p>
<p style="margin:0 0 22px 0;">${esc(l2)}</p>
${bouton(lien, "Je confirme mon inscription", C.bleu, C.blanc)}
<p style="margin:22px 0 0 0;font-size:14px;line-height:20px;color:${C.gris};">Le bouton ne marche pas ? Copie ce lien dans ton navigateur :<br><a href="${esc(lien)}" style="color:${C.bleu};word-break:break-all;">${esc(lien)}</a></p>
<p style="margin:16px 0 0 0;font-size:14px;line-height:20px;color:${C.gris};">${esc(l3)}</p>
</td></tr>
<tr><td bgcolor="${C.fond}" style="padding:16px 32px;background:${C.fond};border-top:2px solid ${C.encre};font-family:${POLICE};font-size:13px;line-height:19px;color:${C.gris};">Les Podcasteur·euses du Sud · <a href="${SITE}" style="color:${C.gris};">les-podcasteur-euses-du-sud.fr</a></td></tr>
</table></td></tr></table></body></html>`;
  const texte = [bonjour, "", l1, l2, "", `Je confirme mon inscription : ${lien}`, "", l3, "", "Les Podcasteur·euses du Sud — " + SITE].join("\n");
  return { objet, html, texte };
};
