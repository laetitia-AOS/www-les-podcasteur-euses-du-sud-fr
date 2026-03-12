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
    const data = payload.data || payload;

    // Extract payer/member info
    const payer = data.payer || {};
    const items = data.items || [];
    const firstItem = items[0] || {};

    const adhesion = {
      email: payer.email || data.email || null,
      prenom: payer.firstName || data.firstName || null,
      nom: payer.lastName || data.lastName || null,
      telephone: payer.phone || null,
      montant: data.amount ? data.amount / 100 : null, // HelloAsso amounts in cents
      type_adhesion: firstItem.name || eventType || "adhesion",
      statut: "active",
      date_adhesion: data.date || new Date().toISOString(),
      helloasso_order_id: String(data.id || data.orderId || ""),
      raw_payload: payload,
    };

    // Skip if this order was already recorded (HelloAsso sends multiple events per transaction)
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

    // Only keep "Order" or membership events, skip pure "Payment" events
    if (eventType === "Payment") {
      console.log("Skipping Payment event, keeping only Order/membership events");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
