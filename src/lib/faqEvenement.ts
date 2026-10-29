/** Questions fréquentes d'une page événement : écrites par l'équipe pour chaque événement, sinon réponses par défaut. */
export type FaqItem = { q: string; r: string };

/** Réponses reprises d'un événement de l'association à l'autre, tant que l'équipe ne les a pas modifiées. */
export const faqParDefaut = (tarif?: string | null): FaqItem[] => [
  { q: "Faut-il payer pour venir ?", r: tarif ? `Tarif : ${tarif}.` : "Non, l'entrée est libre. Les consommations sont à votre charge." },
  { q: "Faut-il faire un podcast pour venir ?", r: "Non. Créateur·ices, auditeur·ices, curieux·ses : la soirée est ouverte à toutes et tous." },
  { q: "Faut-il réserver ?", r: "Cliquez sur « Je viens » : cela nous aide à prévoir la place." },
  { q: "Comment faire écouter mon podcast lors d'un atelier-écoute ?", r: "Écrivez à l'équipe depuis la page « Nous écrire » en présentant votre podcast : elle choisit les écoutes de chaque soirée." },
];

export const FAQ_MAX = 8;

/** Lit la valeur enregistrée : questions et réponses non vides seulement. */
export const lireFaq = (v: unknown): FaqItem[] =>
  Array.isArray(v)
    ? v
        .map((x) => ({ q: String((x as FaqItem)?.q ?? "").trim(), r: String((x as FaqItem)?.r ?? "").trim() }))
        .filter((x) => x.q && x.r)
        .slice(0, FAQ_MAX)
    : [];

/** FAQ affichée : celle de l'événement si l'équipe l'a écrite, sinon les réponses par défaut pour les événements de l'association. */
export const faqPourEvenement = (evt: { faq?: unknown; tarif?: string | null }, organiseParPds: boolean): FaqItem[] => {
  const propre = lireFaq(evt.faq);
  if (propre.length) return propre;
  return organiseParPds ? faqParDefaut(evt.tarif) : [];
};
