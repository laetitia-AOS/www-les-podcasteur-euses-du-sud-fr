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
export async function fetchVerifiedOrder(orderId: string, formType?: string, formSlug?: string): Promise<any | null> {
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

  // 2. Recherche dans les commandes récentes du formulaire, au sein de l'association
  const safe = /^[A-Za-z0-9_-]{1,120}$/;
  if (!formType || !formSlug || !safe.test(formType) || !safe.test(formSlug)) return null;
  for (let page = 1; page <= 5; page++) {
    const url = `${HELLOASSO_API}/v5/organizations/${ORG_SLUG}/forms/${formType}/${formSlug}/orders?pageSize=100&pageIndex=${page}&sortOrder=Desc&withDetails=true`;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      console.warn(`HelloAsso form orders lookup: ${r.status}`);
      return null;
    }
    const body = await r.json();
    // deno-lint-ignore no-explicit-any
    const found = (body?.data || []).find((o: any) => String(o?.id) === orderId);
    if (found) return isOurs(found) ? found : null;
    if (!body?.pagination || page >= body.pagination.totalPages) break;
  }
  return null;
}
