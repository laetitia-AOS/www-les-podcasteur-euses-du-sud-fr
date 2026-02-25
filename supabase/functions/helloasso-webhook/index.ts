import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
