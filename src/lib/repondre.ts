/**
 * Liens pour répondre à un message reçu sur le site.
 * Un lien « mailto » seul ne fait rien quand aucune messagerie n'est installée
 * sur l'ordinateur (cas fréquent avec Gmail dans le navigateur) : on propose donc
 * aussi Gmail en ligne et la copie de l'adresse.
 */
export const COMPTE_EQUIPE = "podcastsdusud@gmail.com";

export type Reponse = { to: string; sujet?: string; corps?: string };

/** Limite raisonnable pour qu'un lien reste accepté par le navigateur. */
const MAX_CORPS = 1500;

const corpsCourt = (corps?: string) =>
  !corps ? "" : corps.length > MAX_CORPS ? `${corps.slice(0, MAX_CORPS)}…` : corps;

export function mailtoHref({ to, sujet, corps }: Reponse): string {
  const params: string[] = [];
  if (sujet) params.push(`subject=${encodeURIComponent(sujet)}`);
  const c = corpsCourt(corps);
  if (c) params.push(`body=${encodeURIComponent(c)}`);
  return `mailto:${encodeURIComponent(to)}${params.length ? `?${params.join("&")}` : ""}`;
}

/** Ouvre un nouveau message dans Gmail ; `compte` choisit la boîte quand plusieurs sont connectées. */
export function gmailHref({ to, sujet, corps }: Reponse, compte?: string): string {
  const p = new URLSearchParams({ view: "cm", fs: "1", to });
  if (sujet) p.set("su", sujet);
  const c = corpsCourt(corps);
  if (c) p.set("body", c);
  if (compte) p.set("authuser", compte);
  return `https://mail.google.com/mail/?${p.toString()}`;
}

/** Cite le message d'origine sous la réponse. */
export function citer(message: string, date?: string): string {
  const entete = date ? `Votre message du ${new Date(date).toLocaleDateString("fr-FR")} :` : "Votre message :";
  return `\n\n\n${entete}\n${message.split("\n").map((l) => `> ${l}`).join("\n")}`;
}
