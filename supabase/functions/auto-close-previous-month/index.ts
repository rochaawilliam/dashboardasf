// Cron-triggered: on day 1 of each month, close (snapshot) the previous month.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const now = new Date();
    // Previous month in São Paulo time (UTC-3)
    const sp = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    let y = sp.getUTCFullYear();
    let m = sp.getUTCMonth(); // 0-based current month, so previous month = this value (when month-1 logic applied)
    if (m === 0) {
      m = 12;
      y = y - 1;
    }
    // m is now 1..12 representing previous month

    const res = await fetch(`${SB_URL}/functions/v1/close-month`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SB_SERVICE}`,
        apikey: SB_SERVICE,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auto: true, year: y, month: m, action: "close" }),
    });
    const out = await res.json();
    return new Response(JSON.stringify({ ok: true, target: { year: y, month: m }, result: out }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
