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

/**
 * Relit une commande directement chez HelloAsso. Renvoie null si elle n'existe pas
 * ou n'appartient pas à l'association : seul ce retour fait foi, jamais le message reçu.
 */
// deno-lint-ignore no-explicit-any
export async function fetchVerifiedOrder(orderId: string): Promise<any | null> {
  if (!/^\d{1,15}$/.test(orderId)) return null;
  const token = await getHelloAssoToken();
  const res = await fetch(`${HELLOASSO_API}/v5/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": UA, Accept: "application/json" },
  });
  if (res.status === 404 || res.status === 403 || res.status === 400) {
    console.warn(`HelloAsso order lookup: ${res.status}`);
    return null;
  }
  if (!res.ok) throw new Error(`HelloAsso order lookup failed [${res.status}]`);
  const order = await res.json();
  const slug = order?.organizationSlug ?? order?.organization?.slug;
  if (slug && slug !== ORG_SLUG) {
    console.warn("HelloAsso order lookup: autre association");
    return null;
  }
  return order;
}
