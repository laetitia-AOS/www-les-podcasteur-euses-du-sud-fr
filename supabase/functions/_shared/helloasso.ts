// Accès à l'API HelloAsso, partagé par l'import (admin) et la confirmation de paiement.
export const HELLOASSO_API = "https://api.helloasso.com";
export const ORG_SLUG = "les-podcasteur-euses-du-sud";
const UA = "LesPodcasteurEusesDuSud/1.0 (+https://www.les-podcasteur-euses-du-sud.fr)";

export async function getHelloAssoToken(): Promise<string> {
  const clientId = Deno.env.get("HELLOASSO_CLIENT_ID");
  const clientSecret = Deno.env.get("HELLOASSO_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("HelloAsso credentials not configured");

  const res = await fetch(`${HELLOASSO_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA, Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200).replace(/\s+/g, " ");
    throw new Error(`HelloAsso auth failed [${res.status}] ${body}`);
  }
  const data = await res.json();
  return data.access_token;
}

const isOurs = (order: any) => {
  const slug = order?.organizationSlug ?? order?.organization?.slug;
  return !slug || slug === ORG_SLUG;
};

/**
 * Relit une commande directement chez HelloAsso. Renvoie null si elle n'existe pas
 * ou n'appartient pas à l'association : seul ce retour fait foi, jamais le message reçu.
 * Le formulaire indiqué dans le message sert seulement à savoir où chercher.
 */
// deno-lint-ignore no-explicit-any
export type OrderCheck =
  // deno-lint-ignore no-explicit-any
  | { status: "verified"; order: any }
  | { status: "not_found" }
  | { status: "unavailable" };

/** Vérifie la commande ; « unavailable » = HelloAsso refuse la lecture (droits de l'accès API). */
export async function checkOrder(orderId: string, formType?: string, formSlug?: string): Promise<OrderCheck> {
  if (!/^\d{1,15}$/.test(orderId)) return { status: "not_found" };
  let refused = false;
  try {
    const order = await fetchVerifiedOrder(orderId, formType, formSlug, () => { refused = true; });
    if (order) return { status: "verified", order };
  } catch (e) {
    console.warn("HelloAsso indisponible:", e instanceof Error ? e.message.slice(0, 120) : "unknown");
    return { status: "unavailable" };
  }
  return refused ? { status: "unavailable" } : { status: "not_found" };
}

export async function fetchVerifiedOrder(orderId: string, formType?: string, formSlug?: string, onRefused?: () => void): Promise<any | null> {
  if (!/^\d{1,15}$/.test(orderId)) return null;
  const token = await getHelloAssoToken();
  const headers = { Authorization: `Bearer ${token}`, "User-Agent": UA, Accept: "application/json" };

  // 1. Lecture directe de la commande
  const res = await fetch(`${HELLOASSO_API}/v5/orders/${orderId}`, { headers });
  if (res.ok) {
    const order = await res.json();
    return isOurs(order) ? order : null;
  }
  console.warn(`HelloAsso order lookup: ${res.status}`);
  if (res.status === 401 || res.status === 403) onRefused?.();

  // 2. Recherche dans les commandes récentes du formulaire, au sein de l'association
  const safe = /^[A-Za-z0-9_-]{1,120}$/;
  if (!formType || !formSlug || !safe.test(formType) || !safe.test(formSlug)) return null;
  for (let page = 1; page <= 5; page++) {
    const url = `${HELLOASSO_API}/v5/organizations/${ORG_SLUG}/forms/${formType}/${formSlug}/items?pageSize=100&pageIndex=${page}&sortOrder=Desc&withDetails=true`;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      console.warn(`HelloAsso form items lookup: ${r.status}`);
      if (r.status === 401 || r.status === 403) onRefused?.();
      return null;
    }
    const body = await r.json();
    // deno-lint-ignore no-explicit-any
    const item = (body?.data || []).find((it: any) => String(it?.order?.id ?? "") === orderId);
    if (item) {
      // Même forme qu'une commande : payeur, montant, date, lignes
      const order = {
        id: item.order?.id,
        date: item.order?.date ?? item.date,
        organizationSlug: item.order?.organizationSlug ?? ORG_SLUG,
        payer: item.payer ?? {},
        amount: { total: item.amount },
        items: [{ name: item.name, amount: item.amount }],
        source: "items",
      };
      return isOurs(order) ? order : null;
    }
    if (!body?.pagination || page >= body.pagination.totalPages) break;
  }
  return null;
}
