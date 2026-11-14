// Envoi par Resend, réservé à L'Onde du Sud (lettre mensuelle et confirmation d'inscription).
// La clé RESEND_API_KEY n'est lue que côté serveur ; sans elle, rien ne part et l'appelant affiche « Envoi pas encore configuré ».
const API = "https://api.resend.com";

export const resendConfigure = () => !!(Deno.env.get("RESEND_API_KEY") || "").trim();

export type MessageResend = {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export type EchecResend = {
  ok: false;
  status: number;
  /** Motif lisible, sans jamais la clé. */
  erreur: string;
  /** Limite du jour ou du mois de l'offre atteinte : attendre avant de reprendre. */
  quota: boolean;
  /** Trop d'appels à la seconde : réessayer après « attente » millisecondes. */
  ralentir: boolean;
  attente: number;
};

const echec = async (r: Response): Promise<EchecResend> => {
  const brut = await r.text().catch(() => "");
  let nom = "";
  let message = brut;
  try {
    const j = JSON.parse(brut);
    nom = String(j?.name || "");
    message = String(j?.message || brut);
  } catch { /* texte brut */ }
  const quota = r.status === 429 && /quota/i.test(nom + message);
  const ralentir = r.status === 429 && !quota;
  const attente = Math.min(10_000, Math.max(1_000, Number(r.headers.get("retry-after") || "1") * 1000));
  return { ok: false, status: r.status, erreur: `${r.status} ${nom || ""} ${message}`.replace(/\s+/g, " ").trim().slice(0, 280), quota, ralentir, attente };
};

const appel = (chemin: string, corps: unknown, cle?: string) =>
  fetch(`${API}${chemin}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${(Deno.env.get("RESEND_API_KEY") || "").trim()}`,
      "Content-Type": "application/json",
      ...(cle ? { "Idempotency-Key": cle.slice(0, 256) } : {}),
    },
    body: JSON.stringify(corps),
  });

export async function resendEnvoyer(m: MessageResend, cle?: string): Promise<{ ok: true; id: string } | EchecResend> {
  try {
    const r = await appel("/emails", m, cle);
    if (!r.ok) return echec(r);
    const j = await r.json().catch(() => ({}));
    return { ok: true, id: String(j?.id || "") };
  } catch (e) {
    return { ok: false, status: 0, erreur: `Resend injoignable : ${e instanceof Error ? e.message.slice(0, 120) : "erreur réseau"}`, quota: false, ralentir: false, attente: 0 };
  }
}

/** Jusqu'à 100 messages en un seul appel (offre Resend). Renvoie les identifiants dans l'ordre. */
export async function resendLot(ms: MessageResend[], cle?: string): Promise<{ ok: true; ids: string[] } | EchecResend> {
  try {
    const r = await appel("/emails/batch", ms, cle);
    if (!r.ok) return echec(r);
    const j = await r.json().catch(() => ({}));
    const data = Array.isArray(j?.data) ? j.data : [];
    return { ok: true, ids: ms.map((_, i) => String(data[i]?.id || "")) };
  } catch (e) {
    return { ok: false, status: 0, erreur: `Resend injoignable : ${e instanceof Error ? e.message.slice(0, 120) : "erreur réseau"}`, quota: false, ralentir: false, attente: 0 };
  }
}
