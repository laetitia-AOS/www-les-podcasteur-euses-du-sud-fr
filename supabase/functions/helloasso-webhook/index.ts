import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("HelloAsso webhook received:", JSON.stringify(payload));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // HelloAsso sends different event types
    const eventType = payload.eventType;
    const normalizedEventType = String(eventType || "").toLowerCase();
    const data = payload.data || payload;

    // Always use the stable order identifier first (prevents Payment/Order duplicates)
    const stableOrderId =
      data?.order?.id ??
      data?.orderId ??
      data?.id ??
      "";
    const helloassoOrderId = stableOrderId ? String(stableOrderId) : "";

    // Only keep Order/membership events, skip Payment events
    if (normalizedEventType === "payment") {
      console.log("Skipping Payment event, keeping only Order/membership events");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract payer/member info
    const payer = data.payer || {};
    const items = data.items || [];
    const firstItem = items[0] || {};
    const amountCents = data.amount ?? firstItem.amount ?? null;

    const adhesion = {
      email: payer.email || data.email || null,
      prenom: payer.firstName || data.firstName || null,
      nom: payer.lastName || data.lastName || null,
      telephone: payer.phone || null,
      montant: amountCents ? amountCents / 100 : null, // HelloAsso amounts in cents
      type_adhesion: firstItem.name || eventType || "adhesion",
      statut: "active",
      date_adhesion: data.order?.date || data.date || new Date().toISOString(),
      helloasso_order_id: helloassoOrderId,
      raw_payload: payload,
    };

    // Skip if this order was already recorded (HelloAsso can send multiple events per transaction)
    if (adhesion.helloasso_order_id) {
      const { data: existing } = await supabase
        .from("adhesions")
        .select("id")
        .eq("helloasso_order_id", adhesion.helloasso_order_id)
        .maybeSingle();

      if (existing) {
        console.log("Skipping duplicate order:", adhesion.helloasso_order_id);
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { error } = await supabase.from("adhesions").insert(adhesion);

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
