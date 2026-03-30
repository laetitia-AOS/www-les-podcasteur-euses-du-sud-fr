import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HELLOASSO_API = "https://api.helloasso.com";
const ORG_SLUG = "les-podcasteur-euses-du-sud";

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("HELLOASSO_CLIENT_ID");
  const clientSecret = Deno.env.get("HELLOASSO_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("HelloAsso credentials not configured");

  const res = await fetch(`${HELLOASSO_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HelloAsso auth failed [${res.status}]: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate admin auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Verify user is admin
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", "")
  );
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.claims.sub;
  const { data: isAdmin } = await supabaseService.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const accessToken = await getAccessToken();

    // Fetch all forms (campaigns) for the org
    const formsRes = await fetch(
      `${HELLOASSO_API}/v5/organizations/${ORG_SLUG}/forms?pageSize=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!formsRes.ok) {
      const text = await formsRes.text();
      throw new Error(`Failed to fetch forms [${formsRes.status}]: ${text}`);
    }

    const formsData = await formsRes.json();
    const forms = formsData.data || [];

    let totalImported = 0;
    let totalSkipped = 0;

    // For each form, fetch all orders/items
    for (const form of forms) {
      let pageIndex = 1;
      let hasMore = true;

      while (hasMore) {
        const ordersRes = await fetch(
          `${HELLOASSO_API}/v5/organizations/${ORG_SLUG}/forms/${form.formType}/${form.formSlug}/items?pageSize=100&pageIndex=${pageIndex}&withDetails=true`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!ordersRes.ok) {
          console.error(`Failed to fetch items for ${form.formSlug}: ${ordersRes.status}`);
          const text = await ordersRes.text();
          console.error(text);
          break;
        }

        const ordersData = await ordersRes.json();
        const items = ordersData.data || [];

        for (const item of items) {
          const payer = item.payer || {};
          const orderId = String(item.order?.id || item.id || "");

          // Skip if already imported
          if (orderId) {
            const { data: existing } = await supabaseService
              .from("adhesions")
              .select("id")
              .eq("helloasso_order_id", orderId)
              .maybeSingle();

            if (existing) {
              totalSkipped++;
              continue;
            }
          }

          const importEmail = payer.email || item.user?.email || null;
          let telephone = payer.phone || null;

          // If no phone from HelloAsso, try the member's podcast profile
          if (!telephone && importEmail) {
            const { data: podcast } = await supabaseService
              .from("podcasts")
              .select("telephone")
              .ilike("email", importEmail)
              .not("telephone", "is", null)
              .maybeSingle();
            if (podcast?.telephone) {
              telephone = podcast.telephone;
            }
          }

          const adhesion = {
            email: importEmail,
            prenom: payer.firstName || item.user?.firstName || null,
            nom: payer.lastName || item.user?.lastName || null,
            telephone,
            montant: item.amount ? item.amount / 100 : null,
            type_adhesion: item.name || form.title || "adhesion",
            statut: "active",
            date_adhesion: item.order?.date || item.date || new Date().toISOString(),
            helloasso_order_id: orderId,
            raw_payload: item,
          };

          const { error } = await supabaseService.from("adhesions").insert(adhesion);
          if (error) {
            console.error("Insert error:", error.message, adhesion.email);
          } else {
            totalImported++;
          }
        }

        // Check pagination
        const pagination = ordersData.pagination;
        if (pagination && pageIndex < pagination.totalPages) {
          pageIndex++;
        } else {
          hasMore = false;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, imported: totalImported, skipped: totalSkipped }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
