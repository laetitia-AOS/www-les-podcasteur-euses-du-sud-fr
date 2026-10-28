import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchVerifiedOrder } from "../_shared/helloasso.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clean = (v: unknown, max = 200): string | null => {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
  return s || null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") return json({ error: "Invalid payload" }, 400);

    const eventType = String(payload.eventType || "").toLowerCase();
    if (eventType === "payment") return json({ success: true, skipped: true });

    // Le message reçu ne sert qu'à connaître le numéro de commande.
    const data = payload.data || {};
    const rawId = data?.order?.id ?? data?.orderId ?? data?.id ?? "";
    const orderId = String(rawId);

    // Tout le reste vient de HelloAsso lui-même : un faux message ne peut rien créer.
    const order = await fetchVerifiedOrder(orderId);
    if (!order) {
      console.warn("Webhook refusé : commande introuvable chez HelloAsso");
      return json({ error: "Order not verified" }, 400);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: existing } = await supabase
      .from("adhesions")
      .select("id")
      .eq("helloasso_order_id", orderId)
      .maybeSingle();
    if (existing) return json({ success: true, skipped: true });

    const payer = order.payer || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const firstItem = items[0] || {};
    const totalCents = typeof order.amount === "number"
      ? order.amount
      : order.amount?.total ?? firstItem.amount ?? null;

    const email = clean(payer.email, 255)?.toLowerCase() ?? null;
    if (!email) return json({ error: "Order without email" }, 400);

    const { error } = await supabase.from("adhesions").insert({
      email,
      prenom: clean(payer.firstName, 100),
      nom: clean(payer.lastName, 100),
      telephone: clean(payer.phone, 30),
      montant: typeof totalCents === "number" ? totalCents / 100 : null,
      type_adhesion: clean(firstItem.name, 150) || "adhesion",
      statut: "active",
      date_adhesion: order.date || new Date().toISOString(),
      helloasso_order_id: orderId,
      raw_payload: order,
    });

    if (error) {
      console.error("Insert error:", error.message);
      return json({ error: "Insert failed" }, 500);
    }
    return json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err instanceof Error ? err.message : "unknown");
    return json({ error: "Server error" }, 500);
  }
});
