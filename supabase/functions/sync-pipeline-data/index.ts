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
  prospects: number;
}

interface AreaBucket {
  leads: number;
  reunioes: number;
  propostas: number;
  contratos: number;
  valor_gerado: number;
}

function newStageBucket(): StageBucket {
  return { leads: 0, reunioes: 0, propostas: 0, contratos: 0, valor_gerado: 0, prospects: 0 };
}

function newAreaBucket(): AreaBucket {
  return { leads: 0, reunioes: 0, propostas: 0, contratos: 0, valor_gerado: 0 };
}

// Ensure nested path exists and return the bucket
function ensureAreaTagBucket(
  obj: Record<string, Record<string, Record<string, Record<string, AreaBucket>>>>,
  month: string, origin: string, area: string, tag: string
): AreaBucket {
  if (!obj[month]) obj[month] = {};
  if (!obj[month][origin]) obj[month][origin] = {};
  if (!obj[month][origin][area]) obj[month][origin][area] = {};
  if (!obj[month][origin][area][tag]) obj[month][origin][area][tag] = newAreaBucket();
  return obj[month][origin][area][tag];
}

function ensureTotalAreaTagBucket(
  obj: Record<string, Record<string, Record<string, AreaBucket>>>,
  origin: string, area: string, tag: string
): AreaBucket {
  if (!obj[origin]) obj[origin] = {};
  if (!obj[origin][area]) obj[origin][area] = {};
  if (!obj[origin][area][tag]) obj[origin][area][tag] = newAreaBucket();
  return obj[origin][area][tag];
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

    // Only fetch cards from ASF Advocacia (exclude Patenteia)
    const ASF_COMPANY_ID = "4a994724-d8ad-4bd7-8b63-73203f249556";

    let monthStrings: string[];
    if (month) {
      monthStrings = [`${year}-${String(month).padStart(2, "0")}`];
    } else {
      monthStrings = Array.from({ length: 12 }, (_, i) =>
        `${year}-${String(i + 1).padStart(2, "0")}`
      );
    }

    const [cardsRes, historyRes] = await Promise.all([
      pipeline.from("pipeline_cards")
        .select("id, stage_id, lead_origin, contract_value, month, practice_area, tag, created_at")
        .eq("company_id", ASF_COMPANY_ID)
        .in("month", monthStrings),
      pipeline.from("card_stage_history")
        .select("card_id, to_stage, moved_at"),
    ]);

    if (cardsRes.error) {
      console.error("Pipeline cards query error:", cardsRes.error);
      return new Response(JSON.stringify({ error: cardsRes.error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cards = cardsRes.data || [];
    const stageHistory = historyRes.data || [];

    const cardIdSet = new Set(cards.map((c: any) => c.id));
    const historyByCard: Record<string, { to_stage: string; moved_at: string }[]> = {};
    for (const h of stageHistory) {
      if (!cardIdSet.has(h.card_id)) continue;
      if (!historyByCard[h.card_id]) historyByCard[h.card_id] = [];
      historyByCard[h.card_id].push({ to_stage: h.to_stage, moved_at: h.moved_at });
    }

    // Group by month and origin (funnel totals)
    const result: Record<string, Record<string, StageBucket>> = {};
    // Group by month, origin, area (aggregated across tags)
    const byArea: Record<string, Record<string, Record<string, AreaBucket>>> = {};
    // Group by month, origin, area, tag (assessoria/pontual)
    const byAreaTag: Record<string, Record<string, Record<string, Record<string, AreaBucket>>>> = {};

    let totalCloseDays = 0;
    let closedCount = 0;
    const closeTimeByMonth: Record<string, { totalDays: number; count: number }> = {};

    for (const card of cards) {
      const cardMonth = card.month;
      const origin = card.lead_origin || "offline";
      const stage = card.stage_id;
      const stageIdx = STAGE_ORDER.indexOf(stage);
      const area = card.practice_area || "outros";
      const tag = card.tag || "pontual";

      const isExcluded = EXCLUDED_STAGES.includes(stage);

      // --- Funnel by origin ---
      if (!result[cardMonth]) result[cardMonth] = {};
      if (!result[cardMonth][origin]) result[cardMonth][origin] = newStageBucket();

      const bucket = result[cardMonth][origin];

      if (stage === "prospects") {
        bucket.prospects++;
      }

      if (stageIdx >= 0) {
        bucket.leads++;
        if (stageIdx >= 1) bucket.reunioes++;
        if (stageIdx >= 2) bucket.propostas++;
        if (stage === "contratos") {
          bucket.contratos++;
          bucket.valor_gerado += card.contract_value || 0;

          const entries = historyByCard[card.id];
          if (entries) {
            const contractMove = entries
              .filter((h) => h.to_stage === "contratos")
              .sort((a, b) => new Date(b.moved_at).getTime() - new Date(a.moved_at).getTime())[0];
            if (contractMove && card.created_at) {
              const created = new Date(card.created_at).getTime();
              const closed = new Date(contractMove.moved_at).getTime();
              const days = Math.max(0, Math.floor((closed - created) / (1000 * 60 * 60 * 24)));
              totalCloseDays += days;
              closedCount++;
              if (!closeTimeByMonth[cardMonth]) closeTimeByMonth[cardMonth] = { totalDays: 0, count: 0 };
              closeTimeByMonth[cardMonth].totalDays += days;
              closeTimeByMonth[cardMonth].count++;
            }
          }
        }
      }

      // --- Breakdown by practice_area (aggregated, no tag split) ---
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

      // --- Breakdown by practice_area + tag ---
      const areaTagBucket = ensureAreaTagBucket(byAreaTag, cardMonth, origin, area, tag);

      if (!isExcluded && stageIdx >= 0) {
        areaTagBucket.leads++;
        if (stageIdx >= 1) areaTagBucket.reunioes++;
        if (stageIdx >= 2) areaTagBucket.propostas++;
      }
      if (stage === "contratos") {
        areaTagBucket.contratos++;
        areaTagBucket.valor_gerado += card.contract_value || 0;
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

    // Yearly totals by origin+area+tag
    const totalsByAreaTag: Record<string, Record<string, Record<string, AreaBucket>>> = {};
    for (const monthData of Object.values(byAreaTag)) {
      for (const [origin, areas] of Object.entries(monthData)) {
        for (const [area, tags] of Object.entries(areas)) {
          for (const [tag, bucket] of Object.entries(tags)) {
            const tb = ensureTotalAreaTagBucket(totalsByAreaTag, origin, area, tag);
            for (const [key, val] of Object.entries(bucket)) {
              (tb as any)[key] += val;
            }
          }
        }
      }
    }

    // Avg close time
    const avgCloseDays = closedCount > 0 ? Math.round(totalCloseDays / closedCount) : null;
    const avgCloseDaysByMonth: Record<string, number | null> = {};
    for (const [m, data] of Object.entries(closeTimeByMonth)) {
      avgCloseDaysByMonth[m] = data.count > 0 ? Math.round(data.totalDays / data.count) : null;
    }

    return new Response(
      JSON.stringify({
        months: result,
        totals,
        byArea,
        totalsByArea,
        byAreaTag,
        totalsByAreaTag,
        year,
        avgCloseDays,
        avgCloseDaysByMonth,
      }),
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
