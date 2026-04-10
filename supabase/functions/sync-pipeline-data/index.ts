import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

// Pipeline Vision Board public credentials
const PIPELINE_URL = "https://lhkdxtefbbpktdqenify.supabase.co";
const PIPELINE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa2R4dGVmYmJwa3RkcWVuaWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzgxODQsImV4cCI6MjA4NjQxNDE4NH0.JbrxqH0ErC1sggjx0oaDwb8med1M2hy2_IKO4StbYkU";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());
    const month = url.searchParams.get("month") ? parseInt(url.searchParams.get("month")!) : null;

    const pipeline = createClient(PIPELINE_URL, PIPELINE_ANON_KEY);

    // Build month filter - pipeline uses "YYYY-MM" format
    let query = pipeline.from("pipeline_cards").select("stage_id, lead_origin, contract_value, month");

    if (month) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}`;
      query = query.eq("month", monthStr);
    } else {
      // Get all months for the year
      const monthStrings = Array.from({ length: 12 }, (_, i) =>
        `${year}-${String(i + 1).padStart(2, "0")}`
      );
      query = query.in("month", monthStrings);
    }

    const { data: cards, error } = await query;

    if (error) {
      console.error("Pipeline query error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by month, origin, and stage
    const result: Record<string, Record<string, Record<string, number>>> = {};

    for (const card of cards || []) {
      const cardMonth = card.month;
      const origin = card.lead_origin || "offline";
      const stage = card.stage_id;

      if (!result[cardMonth]) result[cardMonth] = {};
      if (!result[cardMonth][origin]) {
        result[cardMonth][origin] = {
          leads: 0,
          reunioes: 0,
          propostas: 0,
          contratos: 0,
          valor_gerado: 0,
        };
      }

      // Count cards at each stage (cards at later stages also count for earlier stages)
      const stageOrder = ["leads", "reunioes", "propostas", "r2", "contratos"];
      const stageIdx = stageOrder.indexOf(stage);

      if (stageIdx >= 0) {
        // Count for current stage
        if (stage === "leads") result[cardMonth][origin].leads++;
        if (stage === "reunioes") result[cardMonth][origin].reunioes++;
        if (stage === "propostas" || stage === "r2") result[cardMonth][origin].propostas++;
        if (stage === "contratos") {
          result[cardMonth][origin].contratos++;
          result[cardMonth][origin].valor_gerado += card.contract_value || 0;
        }

        // Cards at later stages count for earlier stages too (funnel logic)
        if (stageIdx >= 1) result[cardMonth][origin].leads++;
        if (stageIdx >= 2) result[cardMonth][origin].reunioes++;
        // r2 is between propostas and contratos
        if (stageIdx >= 3 && stage !== "r2") result[cardMonth][origin].propostas++;
      }
    }

    // Also compute yearly totals
    const totals: Record<string, Record<string, number>> = {};
    for (const monthData of Object.values(result)) {
      for (const [origin, stages] of Object.entries(monthData)) {
        if (!totals[origin]) {
          totals[origin] = { leads: 0, reunioes: 0, propostas: 0, contratos: 0, valor_gerado: 0 };
        }
        for (const [key, val] of Object.entries(stages)) {
          totals[origin][key] += val;
        }
      }
    }

    return new Response(
      JSON.stringify({ months: result, totals, year }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
