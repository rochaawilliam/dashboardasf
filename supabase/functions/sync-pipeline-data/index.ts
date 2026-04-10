import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const PIPELINE_URL = "https://lhkdxtefbbpktdqenify.supabase.co";
const PIPELINE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa2R4dGVmYmJwa3RkcWVuaWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzgxODQsImV4cCI6MjA4NjQxNDE4NH0.JbrxqH0ErC1sggjx0oaDwb8med1M2hy2_IKO4StbYkU";

const STAGE_ORDER = ["leads", "reunioes", "propostas", "r2", "contratos"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());
    const month = url.searchParams.get("month") ? parseInt(url.searchParams.get("month")!) : null;

    const pipeline = createClient(PIPELINE_URL, PIPELINE_ANON_KEY);

    let query = pipeline.from("pipeline_cards").select("stage_id, lead_origin, contract_value, month");

    if (month) {
      const monthStr = `${year}-${String(month).padStart(2, "0")}`;
      query = query.eq("month", monthStr);
    } else {
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

    // Group by month, origin, and count per funnel stage
    // Stages in pipeline: leads, reunioes (R1), propostas, r2 (R2), contratos
    // Counting rules:
    //   leads = cards currently at "leads" stage or beyond
    //   reunioes = cards at "reunioes" (R1) or "r2" (R2) or beyond (propostas, contratos)
    //   propostas = cards at "propostas" stage or beyond (r2, contratos)
    //   contratos = cards at "contratos" stage
    //   valor_gerado = sum of contract_value for "contratos"
    const result: Record<string, Record<string, Record<string, number>>> = {};

    for (const card of cards || []) {
      const cardMonth = card.month;
      const origin = card.lead_origin || "offline";
      const stage = card.stage_id;
      const stageIdx = STAGE_ORDER.indexOf(stage);

      if (stageIdx < 0) continue;

      if (!result[cardMonth]) result[cardMonth] = {};
      if (!result[cardMonth][origin]) {
        result[cardMonth][origin] = {
          leads: 0, reunioes: 0, propostas: 0, contratos: 0, valor_gerado: 0,
        };
      }

      const bucket = result[cardMonth][origin];

      // Every card counts as a lead (all entered the funnel)
      bucket.leads++;

      // Reuniões: card reached R1(reunioes=1) or R2(r2=3) or beyond
      if (stageIdx >= 1) bucket.reunioes++;

      // Propostas: card reached propostas(2) or beyond (r2=3, contratos=4)
      if (stageIdx >= 2) bucket.propostas++;

      // Contratos: only cards at contratos stage
      if (stage === "contratos") {
        bucket.contratos++;
        bucket.valor_gerado += card.contract_value || 0;
      }
    }

    // Yearly totals
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
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
