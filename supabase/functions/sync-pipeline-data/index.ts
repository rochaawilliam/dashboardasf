import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PIPELINE_URL = "https://lhkdxtefbbpktdqenify.supabase.co";
const PIPELINE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa2R4dGVmYmJwa3RkcWVuaWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzgxODQsImV4cCI6MjA4NjQxNDE4NH0.JbrxqH0ErC1sggjx0oaDwb8med1M2hy2_IKO4StbYkU";

const ONBOARDING_URL = "https://ttbwpcmlhssmzsgyppho.supabase.co";
const ONBOARDING_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0YndwY21saHNzbXpzZ3lwcGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTg5NTcsImV4cCI6MjA4NjM5NDk1N30.SZ3iHlhAbCuZgR_P7N65CPj2hxF4yMw47GYYDk-rnrk";

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

interface OperationalMetrics {
  avgActionsPerDay: number;
  followUpRate: number;
  advanceRate: number;
  commentsPerLead: number;
  avgFirstContactHours: number;
  slaRate: number;
  avgHandlingDays: number | null;
}

// Paginated fetch to bypass Supabase 1000-row default limit
async function fetchAll(
  client: any,
  table: string,
  select: string,
  filters?: (query: any) => any,
  pageSize = 1000
): Promise<any[]> {
  const results: any[] = [];
  let from = 0;
  while (true) {
    let query = client.from(table).select(select).range(from, from + pageSize - 1);
    if (filters) query = filters(query);
    const { data, error } = await query;
    if (error) {
      console.error(`Fetch ${table} error:`, error);
      break;
    }
    if (!data || data.length === 0) break;
    results.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return results;
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

    const ASF_COMPANY_ID = "4a994724-d8ad-4bd7-8b63-73203f249556";

    let monthStrings: string[];
    if (month) {
      monthStrings = [`${year}-${String(month).padStart(2, "0")}`];
    } else {
      monthStrings = Array.from({ length: 12 }, (_, i) =>
        `${year}-${String(i + 1).padStart(2, "0")}`
      );
    }

    // Fetch all data with pagination to avoid 1000-row truncation
    const [allCards, stageHistory, cardComments] = await Promise.all([
      fetchAll(pipeline, "pipeline_cards",
        "id, stage_id, lead_origin, contract_value, month, practice_area, tag, created_at, ghost_of, link_group, title",
        (q: any) => q.eq("company_id", ASF_COMPANY_ID).in("month", monthStrings)),
      fetchAll(pipeline, "card_stage_history", "card_id, from_stage, to_stage, moved_at"),
      fetchAll(pipeline, "card_comments", "card_id, created_at"),
    ]);

    const cards = allCards.filter((c: any) => !c.ghost_of);

    const cardIdSet = new Set(cards.map((c: any) => c.id));
    const historyByCard: Record<string, { from_stage: string | null; to_stage: string; moved_at: string }[]> = {};
    for (const h of stageHistory) {
      if (!cardIdSet.has(h.card_id)) continue;
      if (!historyByCard[h.card_id]) historyByCard[h.card_id] = [];
      historyByCard[h.card_id].push({ from_stage: h.from_stage, to_stage: h.to_stage, moved_at: h.moved_at });
    }

    // ─── Cumulative stage counting (matches Pipeline Vision Board logic) ───
    // A card counts for a stage if: it's currently at that stage, it was ever at that stage (via history),
    // or it's currently at a LATER stage (meaning it passed through earlier ones).
    function countCumulativeForStage(stageId: string, cardSet: any[]): number {
      const uniqueCards = new Set<string>();
      const stageIdx = STAGE_ORDER.indexOf(stageId);
      if (stageIdx < 0) return 0;

      for (const card of cardSet) {
        const cardStageIdx = STAGE_ORDER.indexOf(card.stage_id);
        // Card is currently at this stage
        if (card.stage_id === stageId) {
          uniqueCards.add(card.id);
          continue;
        }
        // Card is currently at a later stage (passed through this one)
        if (cardStageIdx > stageIdx) {
          uniqueCards.add(card.id);
          continue;
        }
        // Card was at this stage per history (e.g., now at geladeira but was at leads)
        const entries = historyByCard[card.id] || [];
        if (entries.some((h) => h.to_stage === stageId)) {
          uniqueCards.add(card.id);
        }
      }
      return uniqueCards.size;
    }

    // ─── Deduplication for valor_gerado (matches Pipeline Vision Board) ───
    // Multi-area contracts share the same link_group or title; count value only once
    function deduplicatedValorGerado(contractCards: any[]): number {
      const seen = new Set<string>();
      let total = 0;
      for (const c of contractCards) {
        const key = c.link_group ?? c.title ?? c.id;
        if (seen.has(key)) continue;
        seen.add(key);
        total += c.contract_value || 0;
      }
      return total;
    }

    // Group cards by month for processing
    const cardsByMonth: Record<string, any[]> = {};
    for (const card of cards) {
      if (!cardsByMonth[card.month]) cardsByMonth[card.month] = [];
      cardsByMonth[card.month].push(card);
    }

    // ─── Build funnel results ─────────────────────────────────
    const result: Record<string, Record<string, StageBucket>> = {};
    const byArea: Record<string, Record<string, Record<string, AreaBucket>>> = {};
    const byAreaTag: Record<string, Record<string, Record<string, Record<string, AreaBucket>>>> = {};

    let totalCloseDays = 0;
    let closedCount = 0;
    const closeTimeByMonth: Record<string, { totalDays: number; count: number }> = {};

    // Process per month
    for (const ms of monthStrings) {
      const monthCards = cardsByMonth[ms] || [];
      if (monthCards.length === 0) continue;

      // Group by origin
      const byOrigin: Record<string, any[]> = {};
      for (const card of monthCards) {
        const origin = card.lead_origin || "offline";
        if (!byOrigin[origin]) byOrigin[origin] = [];
        byOrigin[origin].push(card);
      }

      if (!result[ms]) result[ms] = {};

      for (const [origin, originCards] of Object.entries(byOrigin)) {
        const bucket = newStageBucket();

        // Cumulative counting (matches Pipeline)
        bucket.leads = countCumulativeForStage("leads", originCards);
        bucket.reunioes = countCumulativeForStage("reunioes", originCards);
        bucket.propostas = countCumulativeForStage("propostas", originCards);
        bucket.contratos = countCumulativeForStage("contratos", originCards);
        bucket.prospects = originCards.filter((c: any) => c.stage_id === "prospects").length;

        // Deduplicated valor_gerado
        const contractCards = originCards.filter((c: any) => c.stage_id === "contratos");
        bucket.valor_gerado = deduplicatedValorGerado(contractCards);

        result[ms][origin] = bucket;

        // Close time calculation
        for (const card of contractCards) {
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
              if (!closeTimeByMonth[ms]) closeTimeByMonth[ms] = { totalDays: 0, count: 0 };
              closeTimeByMonth[ms].totalDays += days;
              closeTimeByMonth[ms].count++;
            }
          }
        }
      }

      // byArea and byAreaTag processing
      for (const card of monthCards) {
        const origin = card.lead_origin || "offline";
        const stage = card.stage_id;
        const stageIdx = STAGE_ORDER.indexOf(stage);
        const area = card.practice_area || "outros";
        const tag = card.tag || "pontual";
        const isExcluded = EXCLUDED_STAGES.includes(stage);

        if (!byArea[ms]) byArea[ms] = {};
        if (!byArea[ms][origin]) byArea[ms][origin] = {};
        if (!byArea[ms][origin][area]) byArea[ms][origin][area] = newAreaBucket();
        const areaBucket = byArea[ms][origin][area];

        if (!isExcluded && stageIdx >= 0) {
          areaBucket.leads++;
          if (stageIdx >= 1) areaBucket.reunioes++;
          if (stageIdx >= 2) areaBucket.propostas++;
        }
        // Also count via history for cards at excluded stages
        if (isExcluded || stageIdx < 0) {
          const entries = historyByCard[card.id] || [];
          for (const h of entries) {
            const hIdx = STAGE_ORDER.indexOf(h.to_stage);
            if (hIdx >= 0 && hIdx <= 2) {
              if (hIdx === 0) areaBucket.leads++;
              // Don't double-count reunioes/propostas for history-based counting in area
              break; // Just count as lead if it was ever in the funnel
            }
          }
        }
        if (stage === "contratos") {
          areaBucket.contratos++;
          areaBucket.valor_gerado += card.contract_value || 0;
        }

        const areaTagBucket = ensureAreaTagBucket(byAreaTag, ms, origin, area, tag);
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

    // Deduplicate valor_gerado at yearly total level too
    for (const [origin, bucket] of Object.entries(totals)) {
      const allContractCards = cards.filter((c: any) =>
        (c.lead_origin || "offline") === origin && c.stage_id === "contratos"
      );
      bucket.valor_gerado = deduplicatedValorGerado(allContractCards);
    }

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

    const avgCloseDays = closedCount > 0 ? Math.round(totalCloseDays / closedCount) : null;
    const avgCloseDaysByMonth: Record<string, number | null> = {};
    for (const [m, data] of Object.entries(closeTimeByMonth)) {
      avgCloseDaysByMonth[m] = data.count > 0 ? Math.round(data.totalDays / data.count) : null;
    }

    // ─── Operational Metrics ───────────────────────────────────
    const commentsByCard = new Map<string, { card_id: string; created_at: string }[]>();
    for (const cm of cardComments) {
      if (!cardIdSet.has(cm.card_id)) continue;
      if (!commentsByCard.has(cm.card_id)) commentsByCard.set(cm.card_id, []);
      commentsByCard.get(cm.card_id)!.push(cm);
    }

    const operationalByMonth: Record<string, OperationalMetrics> = {};

    for (const ms of monthStrings) {
      const monthCards = cardsByMonth[ms] || [];
      if (monthCards.length === 0) {
        operationalByMonth[ms] = {
          avgActionsPerDay: 0, followUpRate: 0, advanceRate: 0,
          commentsPerLead: 0, avgFirstContactHours: 0, slaRate: 0, avgHandlingDays: null,
        };
        continue;
      }

      const monthStart = new Date(`${ms}-01T00:00:00Z`);
      const nextMonth = new Date(monthStart);
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
      const now = new Date();
      const effectiveEnd = nextMonth > now ? now : nextMonth;

      const inRange = (dateStr: string) => {
        const d = new Date(dateStr);
        return d >= monthStart && d < nextMonth;
      };

      let totalActions = 0;
      const createdIds = new Set(monthCards.map((c: any) => c.id));
      const followedUpIds = new Set<string>();
      const advancedIds = new Set<string>();
      let totalComments = 0;

      for (const [cardId, comments] of commentsByCard.entries()) {
        if (!createdIds.has(cardId)) continue;
        const inRangeComments = comments.filter((cm) => inRange(cm.created_at));
        totalComments += inRangeComments.length;
        totalActions += inRangeComments.length;
        if (inRangeComments.length > 0) followedUpIds.add(cardId);
      }

      for (const card of monthCards) {
        const entries = historyByCard[card.id] || [];
        const inRangeMoves = entries.filter((h) => inRange(h.moved_at));
        totalActions += inRangeMoves.length;
        if (inRangeMoves.length > 0) followedUpIds.add(card.id);
        if (entries.some((h) => h.from_stage && inRange(h.moved_at))) advancedIds.add(card.id);
      }

      totalActions += monthCards.length;

      const totalDays = Math.max(1, Math.floor((effectiveEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));
      const avgActionsPerDay = Math.round((totalActions / totalDays) * 100) / 100;
      const followUpRate = createdIds.size > 0 ? Math.round((followedUpIds.size / createdIds.size) * 10000) / 100 : 0;
      const advanceRate = monthCards.length > 0 ? Math.round((advancedIds.size / monthCards.length) * 10000) / 100 : 0;
      const commentsPerLead = monthCards.length > 0 ? Math.round((totalComments / monthCards.length) * 100) / 100 : 0;

      // ─── TME (First Contact Time) ──────────────────────────────
      // Match Pipeline: only consider cards where created_at month matches the card's month
      // (excludes cards moved from earlier months which have old created_at dates)
      const tmeCards = monthCards.filter((c: any) => {
        const createdMonth = c.created_at ? c.created_at.slice(0, 7) : c.month;
        return createdMonth === ms;
      });

      const firstContactTimes: number[] = [];
      for (const card of tmeCards) {
        const createdAt = new Date(card.created_at).getTime();
        const cardCommentsList = commentsByCard.get(card.id) || [];
        // Find first action after creation (comment or stage move) - no from_stage filter
        const firstComment = cardCommentsList
          .filter((cm) => new Date(cm.created_at).getTime() > createdAt)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
        const cardMoves = (historyByCard[card.id] || [])
          .filter((h) => new Date(h.moved_at).getTime() > createdAt)
          .sort((a, b) => new Date(a.moved_at).getTime() - new Date(b.moved_at).getTime())[0];

        const times: number[] = [];
        if (firstComment) times.push(new Date(firstComment.created_at).getTime());
        if (cardMoves) times.push(new Date(cardMoves.moved_at).getTime());
        if (times.length > 0) {
          const firstAction = Math.min(...times);
          const hours = (firstAction - createdAt) / (1000 * 60 * 60);
          firstContactTimes.push(hours);
        }
      }

      const avgFirstContactHours = firstContactTimes.length > 0
        ? Math.round((firstContactTimes.reduce((a, b) => a + b, 0) / firstContactTimes.length) * 100) / 100
        : 0;
      const slaRate = firstContactTimes.length > 0
        ? Math.round((firstContactTimes.filter((h) => h <= 24).length / firstContactTimes.length) * 10000) / 100
        : 0;

      // ─── TMA (handling time) ─────────────────────────────────
      const handlingDays: number[] = [];
      const tmaCards = monthCards.filter((c: any) => {
        if (c.stage_id !== "contratos" && c.stage_id !== "geladeira") return false;
        const createdMonth = c.created_at ? c.created_at.slice(0, 7) : c.month;
        return createdMonth === ms;
      });

      for (const card of tmaCards) {
        const created = new Date(card.created_at).getTime();
        const entries = (historyByCard[card.id] || [])
          .filter((h) => h.to_stage === "contratos" || h.to_stage === "geladeira")
          .map((h) => new Date(h.moved_at).getTime())
          .sort((a, b) => a - b);
        if (entries.length > 0) {
          handlingDays.push(Math.max(0, Math.round((entries[0] - created) / (1000 * 60 * 60 * 24))));
        }
      }

      operationalByMonth[ms] = {
        avgActionsPerDay,
        followUpRate,
        advanceRate,
        commentsPerLead,
        avgFirstContactHours,
        slaRate,
        avgHandlingDays: handlingDays.length > 0
          ? Math.round(handlingDays.reduce((a, b) => a + b, 0) / handlingDays.length)
          : null,
      };
    }

    // Compute yearly operational totals
    const allMonthOps = Object.values(operationalByMonth).filter((o) => o.avgActionsPerDay > 0 || o.followUpRate > 0);
    const operationalTotals: OperationalMetrics = allMonthOps.length > 0 ? {
      avgActionsPerDay: Math.round(allMonthOps.reduce((s, o) => s + o.avgActionsPerDay, 0) / allMonthOps.length * 100) / 100,
      followUpRate: Math.round(allMonthOps.reduce((s, o) => s + o.followUpRate, 0) / allMonthOps.length * 100) / 100,
      advanceRate: Math.round(allMonthOps.reduce((s, o) => s + o.advanceRate, 0) / allMonthOps.length * 100) / 100,
      commentsPerLead: Math.round(allMonthOps.reduce((s, o) => s + o.commentsPerLead, 0) / allMonthOps.length * 100) / 100,
      avgFirstContactHours: Math.round(allMonthOps.reduce((s, o) => s + o.avgFirstContactHours, 0) / allMonthOps.length * 100) / 100,
      slaRate: Math.round(allMonthOps.reduce((s, o) => s + o.slaRate, 0) / allMonthOps.length * 100) / 100,
      avgHandlingDays: (() => {
        const vals = allMonthOps.filter((o) => o.avgHandlingDays !== null).map((o) => o.avgHandlingDays!);
        return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      })(),
    } : {
      avgActionsPerDay: 0, followUpRate: 0, advanceRate: 0, commentsPerLead: 0,
      avgFirstContactHours: 0, slaRate: 0, avgHandlingDays: null,
    };

    // ─── Onboarding Compass Metrics ─────────────────────────────
    let onboarding = null;
    try {
      const onb = createClient(ONBOARDING_URL, ONBOARDING_ANON_KEY);
      const [clientsRes, stepsRes] = await Promise.all([
        onb.from("onboarding_clients").select("id, entry_date, created_at"),
        onb.from("onboarding_steps").select("client_id, status, completed_date, planned_date"),
      ]);
      const clients = clientsRes.data || [];
      const steps = stepsRes.data || [];

      const allSteps = steps;
      const totalSteps = allSteps.length;

      // Group steps by client
      const stepsByClient = new Map<string, typeof steps>();
      for (const s of allSteps) {
        if (!stepsByClient.has(s.client_id)) stepsByClient.set(s.client_id, []);
        stepsByClient.get(s.client_id)!.push(s);
      }

      // Completed clients = all steps are "Ok"
      const completedClientIds: string[] = [];
      for (const c of clients) {
        const cs = stepsByClient.get(c.id) || [];
        if (cs.length > 0 && cs.every((s: any) => s.status === "Ok")) {
          completedClientIds.push(c.id);
        }
      }

      // Avg onboarding days (completed clients only)
      let avgOnboardingDays: number | null = null;
      if (completedClientIds.length > 0) {
        let totalDays = 0;
        for (const cid of completedClientIds) {
          const client = clients.find((c: any) => c.id === cid);
          if (client) {
            const entry = new Date(client.entry_date).getTime();
            const now = Date.now();
            totalDays += Math.floor((now - entry) / (1000 * 60 * 60 * 24));
          }
        }
        avgOnboardingDays = Math.round(totalDays / completedClientIds.length);
      }

      // Compliance rate: steps completed on time (date <= plannedDate)
      const stepsWithBothDates = allSteps.filter((s: any) => s.status === "Ok" && s.completed_date && s.planned_date);
      const onTimeSteps = stepsWithBothDates.filter((s: any) => s.completed_date <= s.planned_date);
      const complianceRate = stepsWithBothDates.length > 0
        ? Math.round((onTimeSteps.length / stepsWithBothDates.length) * 100)
        : null;

      // Rescheduling rate (Prejudicado steps)
      const prejudicadoCount = allSteps.filter((s: any) => s.status === "Prejudicado").length;
      const reschedulingRate = totalSteps > 0 ? Math.round((prejudicadoCount / totalSteps) * 100) : 0;

      // Overall completion
      const okCount = allSteps.filter((s: any) => s.status === "Ok").length;
      const overallCompletion = totalSteps > 0 ? Math.round((okCount / totalSteps) * 100) : 0;

      onboarding = {
        avgOnboardingDays,
        complianceRate,
        reschedulingRate,
        activeClients: clients.length - completedClientIds.length,
        completedClients: completedClientIds.length,
        overallCompletion,
      };
    } catch (err) {
      console.error("Onboarding fetch error:", err);
    }

    // ── Training data from Google Sheets ──
    let training: any = null;
    try {
      const COLLAB_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSt7ycB9864ONAqIp-4b7Midf3h0gli77qQFBil21vv1nWHo0KrCWIEG9ig4RVJYg/pub?output=csv";
      const TRAINING_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSt7ycB9864ONAqIp-4b7Midf3h0gli77qQFBil21vv1nWHo0KrCWIEG9ig4RVJYg/pub?gid=1563700319&single=true&output=csv";

      const MONTH_MAP: Record<string, number> = {
        jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
        jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
      };

      // Fetch both CSVs in parallel
      const [collabRes, trainingRes] = await Promise.all([
        fetch(COLLAB_CSV_URL),
        fetch(TRAINING_CSV_URL),
      ]);
      const collabCsv = await collabRes.text();
      const trainingCsv = await trainingRes.text();

      // Parse collaborator rows (Colaborador, Cargo, Área, Nível, Status, Ano, Mês)
      interface CollabRow {
        nome: string;
        status: string;
        ano: number;
        mes: number;
      }
      const collabRows = collabCsv.trim().split("\n").slice(1);
      const collaborators: CollabRow[] = [];
      for (const row of collabRows) {
        const cols = row.split(",");
        if (cols.length < 7) continue;
        const mesStr = (cols[6] || "").trim().toLowerCase().substring(0, 3);
        collaborators.push({
          nome: cols[0]?.trim() || "",
          status: cols[4]?.trim() || "",
          ano: parseInt(cols[5]?.trim() || "0"),
          mes: MONTH_MAP[mesStr] || 0,
        });
      }

      // Parse training rows
      const trainingRows = trainingCsv.trim().split("\n").slice(1);
      interface TrainingRow {
        colaborador: string;
        ano: number;
        mes: number;
        modulo: string;
        cargaHoraria: number;
        status: string;
        certificado: boolean;
      }
      const trainings: TrainingRow[] = [];
      for (const row of trainingRows) {
        const cols = row.split(",");
        if (cols.length < 9) continue;
        const mesStr = (cols[2] || "").trim().toLowerCase().substring(0, 3);
        trainings.push({
          colaborador: cols[0]?.trim() || "",
          ano: parseInt(cols[1]?.trim() || "0"),
          mes: MONTH_MAP[mesStr] || 0,
          modulo: cols[3]?.trim() || "",
          cargaHoraria: parseFloat(cols[5]?.trim() || "0") || 0,
          status: cols[6]?.trim() || "",
          certificado: (cols[8]?.trim() || "").toLowerCase() === "sim",
        });
      }

      // Filter trainings by selected year (and month if specified)
      const yearFiltered = trainings.filter(t => t.ano === year);
      const periodFiltered = month
        ? yearFiltered.filter(t => t.mes === month)
        : yearFiltered;

      // Headcount: active collaborators from Colaborador sheet
      const activeCollabs = collaborators.filter(c => c.status.toLowerCase() === "ativo");
      const headcount = activeCollabs.length;

      // Targets (dynamic based on actual headcount)
      const HEADCOUNT_TARGET = 12;
      const HOURS_TARGET = HEADCOUNT_TARGET * 10; // 120
      const MODULES_TARGET = headcount * 2; // dynamic: headcount * 2
      const CERTIFICATION_TARGET = 70; // %
      const AVG_TENURE_TARGET = 12; // months

      // Compute training metrics from period-filtered data
      const trainingByMonth: Record<string, { hours: number; modules: number; certified: number }> = {};
      const byCollaborator: Record<string, { hours: number; modules: Set<string>; certified: number }> = {};
      const byPilar: Record<string, { hours: number; modules: number }> = {};
      const byCollaboratorMonth: Record<string, Record<string, number>> = {};
      let totalHours = 0;
      const allUniqueModules = new Set<string>();
      // Count ALL unique modules assigned (regardless of status)
      for (const t of periodFiltered) {
        if (t.modulo) allUniqueModules.add(t.modulo);
      }
      let totalRecords = 0;
      let totalCertified = 0;

      // Process ALL records (not just concluído) for certification rate denominator
      for (const t of periodFiltered) {
        totalRecords++;
        if (t.certificado) totalCertified++;
      }

      // Process concluído records for hours/modules/charts
      for (const t of periodFiltered) {
        if (t.status.toLowerCase() !== "concluído") continue;
        const monthKey = `${t.ano}-${String(t.mes).padStart(2, "0")}`;

        // By month
        if (!trainingByMonth[monthKey]) trainingByMonth[monthKey] = { hours: 0, modules: 0, certified: 0 };
        trainingByMonth[monthKey].hours += t.cargaHoraria;
        trainingByMonth[monthKey].modules += 1;
        if (t.certificado) trainingByMonth[monthKey].certified += 1;

        // By collaborator
        if (!byCollaborator[t.colaborador]) byCollaborator[t.colaborador] = { hours: 0, modules: new Set(), certified: 0 };
        byCollaborator[t.colaborador].hours += t.cargaHoraria;
        byCollaborator[t.colaborador].modules.add(t.modulo);
        if (t.certificado) byCollaborator[t.colaborador].certified += 1;

        // By collaborator by month
        if (!byCollaboratorMonth[t.colaborador]) byCollaboratorMonth[t.colaborador] = {};
        byCollaboratorMonth[t.colaborador][monthKey] = (byCollaboratorMonth[t.colaborador][monthKey] || 0) + t.cargaHoraria;

        // By pilar/theme
        const pilar = t.modulo || "Outros";
        if (!byPilar[pilar]) byPilar[pilar] = { hours: 0, modules: 0 };
        byPilar[pilar].hours += t.cargaHoraria;
        byPilar[pilar].modules += 1;

        totalHours += t.cargaHoraria;
      }

      const totalModules = allUniqueModules.size;

      // Certification rate: certified records / total records (all statuses)
      const certificationRate = totalRecords > 0
        ? Math.round(totalCertified / totalRecords * 10000) / 100
        : 0;

      // Top collaborators sorted by hours (convert Set to count)
      const topCollaborators = Object.entries(byCollaborator)
        .map(([name, data]) => ({ name, hours: data.hours, modules: data.modules.size, certified: data.certified }))
        .sort((a, b) => b.hours - a.hours);

      // Themes sorted by hours
      const themes = Object.entries(byPilar)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.hours - a.hours);

      // Tempo Médio de Casa: from Colaborador sheet (Ano/Mês = admission date)
      const now = new Date();
      const currentYearMonth = now.getFullYear() * 12 + (now.getMonth() + 1);
      const tenureMonths: number[] = [];
      for (const c of activeCollabs) {
        if (c.ano > 0 && c.mes > 0) {
          const entryYM = c.ano * 12 + c.mes;
          tenureMonths.push(Math.max(0, currentYearMonth - entryYM));
        }
      }
      const avgTenureMonths = tenureMonths.length > 0
        ? Math.round(tenureMonths.reduce((a, b) => a + b, 0) / tenureMonths.length * 10) / 10
        : 0;

      training = {
        headcount,
        avgMonths: avgTenureMonths,
        byMonth: trainingByMonth,
        totalHours,
        totalModules,
        totalCertified,
        certificationRate,
        topCollaborators,
        themes,
        byCollaboratorMonth,
        targets: {
          headcount: HEADCOUNT_TARGET,
          hours: HOURS_TARGET,
          modules: MODULES_TARGET,
          certificationRate: CERTIFICATION_TARGET,
          avgTenureMonths: AVG_TENURE_TARGET,
        },
      };
    } catch (err) {
      console.error("Training fetch error:", err);
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
        operational: operationalByMonth,
        operationalTotals,
        onboarding,
        training,
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
