import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PIPELINE_URL = "https://lhkdxtefbbpktdqenify.supabase.co";
const PIPELINE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa2R4dGVmYmJwa3RkcWVuaWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzgxODQsImV4cCI6MjA4NjQxNDE4NH0.JbrxqH0ErC1sggjx0oaDwb8med1M2hy2_IKO4StbYkU";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STAGE_ORDER = ["leads", "reunioes", "propostas", "r2", "contratos"];
const EXCLUDED_STAGES = ["geladeira", "prospects"];

interface StageBucket {
  leads: number;
  reunioes: number;
  propostas: number;
  contratos: number;
  valor_gerado: number;
}

interface AreaBucket {
  leads: number;
  reunioes: number;
  propostas: number;
  contratos: number;
  valor_gerado: number;
}

function newStageBucket(): StageBucket {
  return { leads: 0, reunioes: 0, propostas: 0, contratos: 0, valor_gerado: 0 };
}

function newAreaBucket(): AreaBucket {
  return { leads: 0, reunioes: 0, propostas: 0, contratos: 0, valor_gerado: 0 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());
    const month = url.searchParams.get("month") ? parseInt(url.searchParams.get("month")!) : null;

    const pipeline = createClient(PIPELINE_URL, PIPELINE_ANON_KEY);

    let query = pipeline.from("pipeline_cards").select("stage_id, lead_origin, contract_value, month, practice_area, tag");

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

    // Group by month and origin
    const result: Record<string, Record<string, StageBucket>> = {};
    // Group by month, origin, and practice_area
    const byArea: Record<string, Record<string, Record<string, AreaBucket>>> = {};

    for (const card of cards || []) {
      const cardMonth = card.month;
      const origin = card.lead_origin || "offline";
      const stage = card.stage_id;
      const stageIdx = STAGE_ORDER.indexOf(stage);
      const area = card.practice_area || "outros";

      // Skip excluded stages for area counting but NOT for funnel counting
      const isExcluded = EXCLUDED_STAGES.includes(stage);

      // --- Funnel by origin (existing logic) ---
      if (stageIdx >= 0) {
        if (!result[cardMonth]) result[cardMonth] = {};
        if (!result[cardMonth][origin]) result[cardMonth][origin] = newStageBucket();

        const bucket = result[cardMonth][origin];
        bucket.leads++;
        if (stageIdx >= 1) bucket.reunioes++;
        if (stageIdx >= 2) bucket.propostas++;
        if (stage === "contratos") {
          bucket.contratos++;
          bucket.valor_gerado += card.contract_value || 0;
        }
      }

      // --- Breakdown by practice_area (excluding geladeira/prospects for lead count) ---
      if (!byArea[cardMonth]) byArea[cardMonth] = {};
      if (!byArea[cardMonth][origin]) byArea[cardMonth][origin] = {};
      if (!byArea[cardMonth][origin][area]) byArea[cardMonth][origin][area] = newAreaBucket();

      const areaBucket = byArea[cardMonth][origin][area];

      if (!isExcluded && stageIdx >= 0) {
        areaBucket.leads++;
        if (stageIdx >= 1) areaBucket.reunioes++;
        if (stageIdx >= 2) areaBucket.propostas++;
      }
      if (stage === "contratos") {
        areaBucket.contratos++;
        areaBucket.valor_gerado += card.contract_value || 0;
      }
    }

    // Yearly totals by origin
    const totals: Record<string, StageBucket> = {};
    for (const monthData of Object.values(result)) {
      for (const [origin, stages] of Object.entries(monthData)) {
        if (!totals[origin]) totals[origin] = newStageBucket();
        for (const [key, val] of Object.entries(stages)) {
          (totals[origin] as any)[key] += val;
        }
      }
    }

    // Yearly totals by origin+area
    const totalsByArea: Record<string, Record<string, AreaBucket>> = {};
    for (const monthData of Object.values(byArea)) {
      for (const [origin, areas] of Object.entries(monthData)) {
        if (!totalsByArea[origin]) totalsByArea[origin] = {};
        for (const [area, bucket] of Object.entries(areas)) {
          if (!totalsByArea[origin][area]) totalsByArea[origin][area] = newAreaBucket();
          for (const [key, val] of Object.entries(bucket)) {
            (totalsByArea[origin][area] as any)[key] += val;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ months: result, totals, byArea, totalsByArea, year }),
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
