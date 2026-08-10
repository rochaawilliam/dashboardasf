import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PIPELINE_URL = "https://lhkdxtefbbpktdqenify.supabase.co";
const PIPELINE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoa2R4dGVmYmJwa3RkcWVuaWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzgxODQsImV4cCI6MjA4NjQxNDE4NH0.JbrxqH0ErC1sggjx0oaDwb8med1M2hy2_IKO4StbYkU";

const ONBOARDING_URL = "https://ttbwpcmlhssmzsgyppho.supabase.co";
const ONBOARDING_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0YndwY21saHNzbXpzZ3lwcGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTg5NTcsImV4cCI6MjA4NjM5NDk1N30.SZ3iHlhAbCuZgR_P7N65CPj2hxF4yMw47GYYDk-rnrk";

/**
 * Creates a Supabase client for an external project.
 * Prefers a service/secret key (env) over the public anon key so the sync keeps
 * working even if the source project revokes public (anon) read grants.
 * Opaque `sb_secret_*` keys must travel in the `apikey` header only.
 */
function makeExternalClient(url: string, fallbackKey: string, secretEnvName: string) {
  const secret = Deno.env.get(secretEnvName)?.trim();
  const key = secret && secret.length > 0 ? secret : fallbackKey;
  const isOpaque = key.startsWith("sb_secret_") || key.startsWith("sb_publishable_");

  const fetchWithoutOpaqueBearer: typeof fetch = async (input, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set("apikey", key);

    // Supabase secret/publishable keys are opaque API keys, not JWTs. The SDK
    // normally mirrors its key into Authorization; remove only that generated
    // value so PostgREST derives the role from the apikey header correctly.
    if (isOpaque && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }

    return fetch(input, { ...init, headers });
  };

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: isOpaque ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` },
      fetch: fetchWithoutOpaqueBearer,
    },
  } as Record<string, unknown>);
}


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Funnel order matching Pipeline Vision Board exactly:
// leads → reunioes (R1) → propostas → r2 (R2) → contratos
// R2 is a SEPARATE stage AFTER propostas, not part of reunioes.
const FULL_STAGE_ORDER = ["leads", "reunioes", "propostas", "r2", "contratos"];
const EXCLUDED_STAGES = ["geladeira", "prospects"];

interface StageBucket {
  leads: number;
  reunioes: number;
  propostas: number;
  contratos: number;
  valor_gerado: number;
  prospects: number;
  new_leads: number;
}

interface AreaBucket {
  leads: number;
  reunioes: number;
  propostas: number;
  contratos: number;
  valor_gerado: number;
}

function newStageBucket(): StageBucket {
  return { leads: 0, reunioes: 0, propostas: 0, contratos: 0, valor_gerado: 0, prospects: 0, new_leads: 0 };
}

function newAreaBucket(): AreaBucket {
  return { leads: 0, reunioes: 0, propostas: 0, contratos: 0, valor_gerado: 0 };
}

/**
 * TMA (dias) — idêntico ao Pipeline Vision Board (computeTma):
 * dias no funil desde a criação até o fechamento (contratos/geladeira) ou até hoje
 * para cards ainda abertos. Leads multi-área (mesmo link_group) contam uma vez.
 */
function computeTmaDays(
  list: any[],
  historyByCard: Record<string, { from_stage: string | null; to_stage: string; moved_at: string }[]>,
): number | null {
  const now = Date.now();
  const groups = new Map<string, any[]>();
  for (const c of list) {
    if (c.ghost_of || c.stage_id === "prospects") continue;
    const key = c.link_group ?? c.id;
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }
  const values: number[] = [];
  groups.forEach((groupCards) => {
    const created = Math.min(...groupCards.map((c: any) => new Date(c.created_at).getTime()));
    const arrivals: number[] = [];
    let closed = false;
    for (const c of groupCards) {
      if (c.stage_id === "contratos" || c.stage_id === "geladeira") closed = true;
      for (const h of historyByCard[c.id] || []) {
        if (h.to_stage === "contratos" || h.to_stage === "geladeira") arrivals.push(new Date(h.moved_at).getTime());
      }
    }
    const end = closed && arrivals.length > 0 ? Math.min(...arrivals) : now;
    values.push(Math.max(0, (end - created) / (1000 * 60 * 60 * 24)));
  });
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
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

const REQUIRED_TABLES = ["pipeline_cards", "card_stage_history", "card_comments"] as const;

interface AccessCheckResult {
  ok: boolean;
  usingServiceKey: boolean;
  tables: Record<string, { ok: boolean; code?: string; message?: string; reason?: string }>;
  blocked: string[];
}

/**
 * Preflight: verifica se o SELECT (GRANT + RLS) está liberado nas tabelas do
 * projeto Pipeline antes de puxar os dados. Evita "sincronizar" zeros silenciosos.
 */
async function checkPipelineAccess(client: any): Promise<AccessCheckResult> {
  const usingServiceKey = !!Deno.env.get("PIPELINE_SERVICE_KEY")?.trim();
  const tables: AccessCheckResult["tables"] = {};
  const blocked: string[] = [];

  await Promise.all(
    REQUIRED_TABLES.map(async (table) => {
      const { error } = await client.from(table).select("*").limit(1);
      if (!error) {
        tables[table] = { ok: true };
        return;
      }
      const code = (error as any).code ?? "";
      const raw = [error.message, (error as any).hint, (error as any).details]
        .filter(Boolean)
        .join(" | ");
      const message = raw || JSON.stringify(error) || "erro desconhecido";
      const reason =
        code === "42501" || /permission denied/i.test(message)
          ? "grant_missing"
          : /invalid api key|jwt|unauthorized/i.test(message)
            ? "invalid_key"
            : /does not exist|relation/i.test(message)
              ? "table_missing"
              : "unknown";
      tables[table] = { ok: false, code, message, reason };
      blocked.push(table);
      console.error(`[access-check] ${table} bloqueado (${reason}): ${message}`);
    })
  );

  return { ok: blocked.length === 0, usingServiceKey, tables, blocked };
}

function accessErrorPayload(check: AccessCheckResult) {
  const grantSql = REQUIRED_TABLES.map(
    (t) => `GRANT SELECT ON public.${t} TO service_role;`
  ).join("\n");
  return {
    error: "pipeline_access_denied",
    message:
      "Sem permissão de leitura nas tabelas do Pipeline Vision Board. A sincronização foi abortada para não gravar valores zerados.",
    usingServiceKey: check.usingServiceKey,
    blockedTables: check.blocked,
    tables: check.tables,
    fix: {
      project: "Pipeline Vision Board",
      sql: grantSql,
      note: "A chave de serviço ignora RLS; não é necessário criar policy pública nem liberar anon.",
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());
    const month = url.searchParams.get("month") ? parseInt(url.searchParams.get("month")!) : null;

    let pipeline = makeExternalClient(PIPELINE_URL, PIPELINE_ANON_KEY, "PIPELINE_SERVICE_KEY");

    // Validação automática de RLS/permissões antes de puxar qualquer dado.
    let access = await checkPipelineAccess(pipeline);

    // Se a chave de serviço configurada for inválida, tenta novamente com a chave pública.
    if (
      !access.ok &&
      access.usingServiceKey &&
      Object.values(access.tables).some((t) => t.reason === "invalid_key")
    ) {
      console.warn("[access-check] PIPELINE_SERVICE_KEY inválida — tentando chave pública");
      const anonClient = makeExternalClient(PIPELINE_URL, PIPELINE_ANON_KEY, "__none__");
      const anonAccess = await checkPipelineAccess(anonClient);
      anonAccess.usingServiceKey = false;
      if (anonAccess.ok) {
        pipeline = anonClient;
        access = anonAccess;
      } else {
        access = { ...anonAccess, usingServiceKey: true };
      }
    }

    const checkOnly = url.searchParams.get("check") === "1";


    if (checkOnly) {
      return new Response(JSON.stringify(access.ok ? { ok: true, ...access } : accessErrorPayload(access)), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!access.ok) {
      return new Response(JSON.stringify(accessErrorPayload(access)), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ASF_COMPANY_ID = "4a994724-d8ad-4bd7-8b63-73203f249556";


    let monthStrings: string[];
    if (month) {
      monthStrings = [`${year}-${String(month).padStart(2, "0")}`];
    } else {
      monthStrings = Array.from({ length: 12 }, (_, i) =>
        `${year}-${String(i + 1).padStart(2, "0")}`
      );
    }

    // Fetch ALL company cards (no month filter) — Operacional uses created_at, not month field
    const [allCards, stageHistory, cardComments, leadScores] = await Promise.all([
      fetchAll(pipeline, "pipeline_cards",
        "id, stage_id, lead_origin, contract_value, month, practice_area, tag, created_at, ghost_of, link_group, title",
        (q: any) => q.eq("company_id", ASF_COMPANY_ID)),
      fetchAll(pipeline, "card_stage_history", "card_id, from_stage, to_stage, moved_at"),
      fetchAll(pipeline, "card_comments", "card_id, created_at"),
      fetchAll(pipeline, "lead_scores", "card_id, classificacao"),
    ]);

    // Lead scoring (MQL/SQL) vindo direto do Pipeline Vision Board
    const classByCard = new Map<string, string>();
    for (const ls of leadScores) {
      if (ls?.card_id && ls?.classificacao) classByCard.set(ls.card_id, String(ls.classificacao));
    }


    // Blocklist: cards removidos do Pipeline mas que ainda aparecem por inconsistência.
    // Filtramos por título (case-insensitive, substring) — afeta contagens, valor_gerado e tooltips.
    const TITLE_BLOCKLIST = [
      "saga licita", // Saga Licitação — contrato removido do Pipeline
    ];
    const isBlocked = (title: any) => {
      if (!title) return false;
      const t = String(title).toLowerCase();
      return TITLE_BLOCKLIST.some((b) => t.includes(b));
    };

    const cards = allCards.filter((c: any) => !c.ghost_of && !isBlocked(c.title));

    const cardIdSet = new Set(cards.map((c: any) => c.id));
    const historyByCard: Record<string, { from_stage: string | null; to_stage: string; moved_at: string }[]> = {};
    for (const h of stageHistory) {
      if (!cardIdSet.has(h.card_id)) continue;
      if (!historyByCard[h.card_id]) historyByCard[h.card_id] = [];
      historyByCard[h.card_id].push({ from_stage: h.from_stage, to_stage: h.to_stage, moved_at: h.moved_at });
    }

    // Build card lookup for origin/area/tag
    const cardById = new Map<string, any>();
    for (const c of cards) cardById.set(c.id, c);

    // ─── "Leads no Funil" (Pipeline Vision Board definition) ───
    // Cards (não-ghosts) que estiveram em alguma etapa do funil (≠ prospects/geladeira)
    // em qualquer instante DENTRO do período — inclui cards criados antes do período
    // e cards migrados para fora depois.
    const isFunnelStage = (s: string) => s !== "prospects" && s !== "geladeira";
    function wasInFunnelDuringPeriod(card: any, periodStart: Date, periodEnd: Date): boolean {
      const createdAt = new Date(card.created_at);
      if (createdAt >= periodEnd) return false;
      const hist = (historyByCard[card.id] || []).slice()
        .sort((a, b) => new Date(a.moved_at).getTime() - new Date(b.moved_at).getTime());
      const events: { at: Date; stage: string }[] = hist.map((h) => ({
        at: new Date(h.moved_at),
        stage: h.to_stage,
      }));
      if (events.length === 0) events.push({ at: createdAt, stage: card.stage_id });
      if (events[0].at > createdAt) events.unshift({ at: createdAt, stage: events[0].stage });
      let stageAtStart = events[0].stage;
      for (const e of events) {
        if (e.at <= periodStart) stageAtStart = e.stage;
        else break;
      }
      if (createdAt < periodStart && isFunnelStage(stageAtStart)) return true;
      for (const e of events) {
        if (e.at >= periodStart && e.at < periodEnd && isFunnelStage(e.stage)) return true;
      }
      if (createdAt >= periodStart && createdAt < periodEnd && isFunnelStage(events[0].stage)) return true;
      return false;
    }

    // ─── Passage-based counting ───
    // Regra: conta CADA movimentação (passage) para qualquer stage em targetStages
    // cujo moved_at caia dentro do mês. Sem dedupe por card ou link_group — cada
    // movimentação representa uma reunião/proposta/contrato realizado(a) no mês,
    // espelhando "qualquer movimentação para a etapa" do Operacional do Pipeline.
    // Filtros (origem/área/tag) são aplicados via filterCardIds.
    const STAGE_ORDER_FULL = ["prospects", "leads", "reunioes", "propostas", "r2", "contratos", "geladeira"];

    function countPassages(
      targetStages: string[],
      _monthCreatedCards: any[], // mantido por compatibilidade de assinatura
      filterCardIds: Set<string>,
      rangeStart: Date,
      rangeEnd: Date,
      _currentMs?: string,
    ): { count: number; names: string[], cards: any[] } {
      const names: string[] = [];
      const matchedCards: any[] = [];
      let count = 0;

      for (const cardId of filterCardIds) {
        const card = cardById.get(cardId);
        const entries = historyByCard[cardId] || [];
        for (const h of entries) {
          if (!targetStages.includes(h.to_stage)) continue;
          const d = new Date(h.moved_at);
          if (d < rangeStart || d >= rangeEnd) continue;
          count += 1;
          names.push(card?.title ?? cardId);
          if (card) matchedCards.push(card);
        }
      }

      return { count, names, cards: matchedCards };
    }


    // Stage-to-targetStages mapping (matching Operacional):
    // reuniões = passages through ["reunioes", "r2"]
    // propostas = passages through ["propostas"]
    // leads = passages through ["leads"]
    // contratos = passages through ["contratos"]
    const STAGE_TARGETS: Record<string, string[]> = {
      leads: ["leads"],
      reunioes: ["reunioes", "r2"],
      propostas: ["propostas"],
      contratos: ["contratos"],
    };

    // ─── Deduplication helpers ───
    // Same deal pode aparecer como vários cards (transições de etapa, ghosts, ou cards
    // irmãos por área). IMPORTANTE: contratos que legitimamente atravessam mais de uma
    // área (ex.: Expomix, Pelf Cred — empresarial + trabalhista) DEVEM contar uma vez
    // POR área. Por isso a chave de dedupe inclui practice_area: colapsamos só os
    // duplicados verdadeiros dentro da mesma área.
    // Espelho do Pipeline Vision Board:
    // - CONTAGEM de contratos = raw (todos os cards em stage "contratos", sem ghosts).
    //   Contratos multi-área (Expomix, Pelf Cred) contam 1 vez por área, exatamente
    //   como o Pipeline exibe.
    // - VALOR GERADO = deduplicado por (link_group ?? title), regra idêntica ao
    //   `totalContractValue` do Dashboard do Pipeline — evita somar o valor 2x
    //   quando o mesmo contrato está em duas áreas.
    function dedupKey(c: any): string {
      if (c.link_group) return `lg:${c.link_group}`;
      if (c.title) return `t:${String(c.title).toLowerCase().trim()}`;
      return `id:${c.id}`;
    }
    function dedupCards(arr: any[]): any[] {
      const seen = new Set<string>();
      const out: any[] = [];
      for (const c of arr) {
        const k = dedupKey(c);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(c);
      }
      return out;
    }
    function deduplicatedValorGerado(contractCards: any[]): number {
      return dedupCards(contractCards).reduce((s, c) => s + (c.contract_value || 0), 0);
    }
    // Snapshot of deals currently in "contratos" for a set of cards.
    // count = raw (Pipeline Vision Board rule); `cards` mantém todos para o
    // cálculo de valor (que dedupa internamente).
    function uniqueContratos(filteredCards: any[]): { count: number; names: string[]; cards: any[] } {
      const inContratos = filteredCards.filter((c: any) => c.stage_id === "contratos" && !c.ghost_of);
      return { count: inContratos.length, names: inContratos.map((c) => c.title ?? c.id), cards: inContratos };
    }

    // Build card ID sets from ALL cards (not just month-created) for history passage checks
    // Operacional uses companyCardIds (all cards) for history filtering
    const allCardIdsByOrigin: Record<string, Set<string>> = {};
    const allCardIdsByOriginArea: Record<string, Record<string, Set<string>>> = {};
    const allCardIdsByOriginAreaTag: Record<string, Record<string, Record<string, Set<string>>>> = {};
    for (const c of cards) {
      const origin = c.lead_origin || "offline";
      const area = c.practice_area || "outros";
      const tag = c.tag || "pontual";
      if (!allCardIdsByOrigin[origin]) allCardIdsByOrigin[origin] = new Set();
      allCardIdsByOrigin[origin].add(c.id);
      if (!allCardIdsByOriginArea[origin]) allCardIdsByOriginArea[origin] = {};
      if (!allCardIdsByOriginArea[origin][area]) allCardIdsByOriginArea[origin][area] = new Set();
      allCardIdsByOriginArea[origin][area].add(c.id);
      if (!allCardIdsByOriginAreaTag[origin]) allCardIdsByOriginAreaTag[origin] = {};
      if (!allCardIdsByOriginAreaTag[origin][area]) allCardIdsByOriginAreaTag[origin][area] = {};
      if (!allCardIdsByOriginAreaTag[origin][area][tag]) allCardIdsByOriginAreaTag[origin][area][tag] = new Set();
      allCardIdsByOriginAreaTag[origin][area][tag].add(c.id);
    }

    // ─── Build funnel results ─────────────────────────────────
    const result: Record<string, Record<string, StageBucket>> = {};
    const byArea: Record<string, Record<string, Record<string, AreaBucket>>> = {};
    const byAreaTag: Record<string, Record<string, Record<string, Record<string, AreaBucket>>>> = {};
    // Card names: month -> origin -> stage -> string[]
    const cardNames: Record<string, Record<string, Record<string, string[]>>> = {};
    // Card names by area: month -> origin -> area -> stage -> string[]
    const cardNamesByArea: Record<string, Record<string, Record<string, Record<string, string[]>>>> = {};
    // Card names by area+tag: month -> origin -> area -> tag -> stage -> string[]
    const cardNamesByAreaTag: Record<string, Record<string, Record<string, Record<string, Record<string, string[]>>>>> = {};

    let totalCloseDays = 0;
    let closedCount = 0;
    const closeTimeByMonth: Record<string, { totalDays: number; count: number }> = {};

    // Process per month
    for (const ms of monthStrings) {
      const [y, m] = ms.split("-").map(Number);
      const rangeStart = new Date(y, m - 1, 1);
      const rangeEnd = new Date(y, m, 1);

      // monthCards: cards belonging to this month.
      // Prefer the explicit `month` field (set by Pipeline when a card is migrated between months);
      // fall back to created_at when month is null/empty.
      const monthCards = cards.filter((c: any) => {
        if (c.month) return c.month === ms;
        const d = new Date(c.created_at);
        return d >= rangeStart && d < rangeEnd;
      });

      // Group month-created cards by origin
      const byOriginMonthCards: Record<string, any[]> = {};
      for (const card of monthCards) {
        const origin = card.lead_origin || "offline";
        if (!byOriginMonthCards[origin]) byOriginMonthCards[origin] = [];
        byOriginMonthCards[origin].push(card);
      }

      // Get all unique origins that have either month cards or all-time cards
      const allOrigins = new Set([
        ...Object.keys(byOriginMonthCards),
        ...Object.keys(allCardIdsByOrigin),
      ]);

      for (const origin of allOrigins) {
        const originMonthCards = byOriginMonthCards[origin] || [];
        const originAllIds = allCardIdsByOrigin[origin] || new Set();
        const bucket = newStageBucket();

        // Passage-based counting (matching Operacional) — usada para reuniões/propostas
        const pReunioes = countPassages(STAGE_TARGETS.reunioes, originMonthCards, originAllIds, rangeStart, rangeEnd, ms);
        const pPropostas = countPassages(STAGE_TARGETS.propostas, originMonthCards, originAllIds, rangeStart, rangeEnd, ms);
        // Contratos = SNAPSHOT por `month` field (mesma lógica do Pipeline Vision Board),
        // deduplicado por link_group ?? título. Isso evita contar Expomix 3x quando o mesmo
        // deal tem múltiplas passagens, e inclui contratos como JAVAILI que foram criados
        // diretamente no estágio "contratos" ou movidos em outro mês mas pertencem a este.
        const uContratos = uniqueContratos(originMonthCards);
        // Mantemos pContratos só para métrica de close-time (precisa do moved_at)
        const pContratos = countPassages(STAGE_TARGETS.contratos, originMonthCards, originAllIds, rangeStart, rangeEnd, ms);

        // Leads = cards cadastrados (created_at) DENTRO do mês, excluindo prospects/geladeira.
        // Cards migrados de outro mês (created_at fora do range) NÃO contam aqui, mesmo que `month` aponte para este mês.
        const leadsCards = originMonthCards.filter((c: any) => {
          if (["prospects", "geladeira"].includes(c.stage_id)) return false;
          const d = c.created_at ? new Date(c.created_at) : null;
          return d !== null && d >= rangeStart && d < rangeEnd;
        });
        bucket.leads = leadsCards.length;
        bucket.reunioes = pReunioes.count;
        bucket.propostas = pPropostas.count;
        bucket.contratos = uContratos.count;
        bucket.prospects = originMonthCards.filter((c: any) => c.stage_id === "prospects").length;
        // New leads = mesma definição (cards criados no mês excluindo prospects/geladeira)
        bucket.new_leads = leadsCards.length;

        // Store card names
        if (!cardNames[ms]) cardNames[ms] = {};
        if (!cardNames[ms][origin]) cardNames[ms][origin] = {};
        cardNames[ms][origin]["leads"] = leadsCards.map((c: any) => c.title ?? c.id);
        cardNames[ms][origin]["reunioes"] = pReunioes.names;
        cardNames[ms][origin]["propostas"] = pPropostas.names;
        cardNames[ms][origin]["contratos"] = uContratos.names;
        cardNames[ms][origin]["prospects"] = originMonthCards.filter((c: any) => c.stage_id === "prospects").map((c: any) => c.title ?? c.id);
        cardNames[ms][origin]["new_leads"] = leadsCards.map((c: any) => c.title ?? c.id);

        // Deduplicated valor_gerado (dos contratos snapshot)
        bucket.valor_gerado = deduplicatedValorGerado(uContratos.cards);

        if (bucket.leads > 0 || bucket.reunioes > 0 || bucket.propostas > 0 || bucket.contratos > 0 || bucket.prospects > 0 || bucket.new_leads > 0) {
          if (!result[ms]) result[ms] = {};
          result[ms][origin] = bucket;
        }

        // Close time calculation (usa passages — precisa do moved_at)
        for (const card of pContratos.cards) {
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

      // byArea and byAreaTag — passage-based counting using ALL card IDs per origin/area/tag
      const byOriginAreaMonthCards: Record<string, Record<string, any[]>> = {};
      const byOriginAreaTagMonthCards: Record<string, Record<string, Record<string, any[]>>> = {};
      for (const card of monthCards) {
        const origin = card.lead_origin || "offline";
        const area = card.practice_area || "outros";
        const tag = card.tag || "pontual";
        if (!byOriginAreaMonthCards[origin]) byOriginAreaMonthCards[origin] = {};
        if (!byOriginAreaMonthCards[origin][area]) byOriginAreaMonthCards[origin][area] = [];
        byOriginAreaMonthCards[origin][area].push(card);
        if (!byOriginAreaTagMonthCards[origin]) byOriginAreaTagMonthCards[origin] = {};
        if (!byOriginAreaTagMonthCards[origin][area]) byOriginAreaTagMonthCards[origin][area] = {};
        if (!byOriginAreaTagMonthCards[origin][area][tag]) byOriginAreaTagMonthCards[origin][area][tag] = [];
        byOriginAreaTagMonthCards[origin][area][tag].push(card);
      }

      // Also include origins/areas/tags that have no month-created cards but have history passages
      const allAreaOrigins = new Set([
        ...Object.keys(byOriginAreaMonthCards),
        ...Object.keys(allCardIdsByOriginArea),
      ]);

      for (const origin of allAreaOrigins) {
        if (!byArea[ms]) byArea[ms] = {};
        if (!byArea[ms][origin]) byArea[ms][origin] = {};
        const allAreas = new Set([
          ...Object.keys(byOriginAreaMonthCards[origin] || {}),
          ...Object.keys(allCardIdsByOriginArea[origin] || {}),
        ]);
        for (const area of allAreas) {
          const areaMonthCards = byOriginAreaMonthCards[origin]?.[area] || [];
          const areaAllIds = allCardIdsByOriginArea[origin]?.[area] || new Set();
          const b = newAreaBucket();
          const areaLeadsCards = areaMonthCards.filter((c: any) => {
            if (["prospects", "geladeira"].includes(c.stage_id)) return false;
            const d = c.created_at ? new Date(c.created_at) : null;
            return d !== null && d >= rangeStart && d < rangeEnd;
          });
          const paReunioes = countPassages(STAGE_TARGETS.reunioes, areaMonthCards, areaAllIds, rangeStart, rangeEnd, ms);
          const paPropostas = countPassages(STAGE_TARGETS.propostas, areaMonthCards, areaAllIds, rangeStart, rangeEnd, ms);
          const paContratos = uniqueContratos(areaMonthCards);
          b.leads = areaLeadsCards.length;
          b.reunioes = paReunioes.count;
          b.propostas = paPropostas.count;
          b.contratos = paContratos.count;
          b.valor_gerado = deduplicatedValorGerado(paContratos.cards);
          if (b.leads > 0 || b.reunioes > 0 || b.propostas > 0 || b.contratos > 0) {
            byArea[ms][origin][area] = b;
          }
          // Store area card names
          if (!cardNamesByArea[ms]) cardNamesByArea[ms] = {};
          if (!cardNamesByArea[ms][origin]) cardNamesByArea[ms][origin] = {};
          if (!cardNamesByArea[ms][origin][area]) cardNamesByArea[ms][origin][area] = {};
          cardNamesByArea[ms][origin][area]["leads"] = areaLeadsCards.map((c: any) => c.title ?? c.id);
          cardNamesByArea[ms][origin][area]["reunioes"] = paReunioes.names;
          cardNamesByArea[ms][origin][area]["propostas"] = paPropostas.names;
          cardNamesByArea[ms][origin][area]["contratos"] = paContratos.names;
        }
      }

      for (const origin of allAreaOrigins) {
        const allAreas = new Set([
          ...Object.keys(byOriginAreaTagMonthCards[origin] || {}),
          ...Object.keys(allCardIdsByOriginAreaTag[origin] || {}),
        ]);
        for (const area of allAreas) {
          const allTags = new Set([
            ...Object.keys(byOriginAreaTagMonthCards[origin]?.[area] || {}),
            ...Object.keys(allCardIdsByOriginAreaTag[origin]?.[area] || {}),
          ]);
          for (const tag of allTags) {
            const tagMonthCards = byOriginAreaTagMonthCards[origin]?.[area]?.[tag] || [];
            const tagAllIds = allCardIdsByOriginAreaTag[origin]?.[area]?.[tag] || new Set();
            const b = ensureAreaTagBucket(byAreaTag, ms, origin, area, tag);
            const tagLeadsCards = tagMonthCards.filter((c: any) => {
              if (["prospects", "geladeira"].includes(c.stage_id)) return false;
              const d = c.created_at ? new Date(c.created_at) : null;
              return d !== null && d >= rangeStart && d < rangeEnd;
            });
            const ptReunioes = countPassages(STAGE_TARGETS.reunioes, tagMonthCards, tagAllIds, rangeStart, rangeEnd, ms);
            const ptPropostas = countPassages(STAGE_TARGETS.propostas, tagMonthCards, tagAllIds, rangeStart, rangeEnd, ms);
            const ptContratos = uniqueContratos(tagMonthCards);
            b.leads = tagLeadsCards.length;
            b.reunioes = ptReunioes.count;
            b.propostas = ptPropostas.count;
            b.contratos = ptContratos.count;
            b.valor_gerado = deduplicatedValorGerado(ptContratos.cards);
            // Store area+tag card names
            if (!cardNamesByAreaTag[ms]) cardNamesByAreaTag[ms] = {};
            if (!cardNamesByAreaTag[ms][origin]) cardNamesByAreaTag[ms][origin] = {};
            if (!cardNamesByAreaTag[ms][origin][area]) cardNamesByAreaTag[ms][origin][area] = {};
            if (!cardNamesByAreaTag[ms][origin][area][tag]) cardNamesByAreaTag[ms][origin][area][tag] = {};
            cardNamesByAreaTag[ms][origin][area][tag]["leads"] = tagLeadsCards.map((c: any) => c.title ?? c.id);
            cardNamesByAreaTag[ms][origin][area][tag]["reunioes"] = ptReunioes.names;
            cardNamesByAreaTag[ms][origin][area][tag]["propostas"] = ptPropostas.names;
            cardNamesByAreaTag[ms][origin][area][tag]["contratos"] = ptContratos.names;
          }
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
      const [y, m] = ms.split("-").map(Number);
      const opRangeStart = new Date(y, m - 1, 1);
      const opRangeEnd = new Date(y, m, 1);
      // Use created_at filtering to match Operacional (not the month field)
      const monthCards = cards.filter((c: any) => {
        const d = new Date(c.created_at);
        return d >= opRangeStart && d < opRangeEnd;
      });
      if (monthCards.length === 0) {
        operationalByMonth[ms] = {
          avgActionsPerDay: 0, followUpRate: 0, advanceRate: 0,
          commentsPerLead: 0, avgFirstContactHours: 0, slaRate: 0, avgHandlingDays: null,
        };
        continue;
      }

      const now = new Date();
      const effectiveEnd = opRangeEnd > now ? now : opRangeEnd;

      const inRange = (dateStr: string) => {
        const d = new Date(dateStr);
        return d >= opRangeStart && d < opRangeEnd;
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

      const totalDays = Math.max(1, Math.floor((effectiveEnd.getTime() - opRangeStart.getTime()) / (1000 * 60 * 60 * 24)));
      const avgActionsPerDay = Math.round((totalActions / totalDays) * 100) / 100;
      const followUpRate = createdIds.size > 0 ? Math.round((followedUpIds.size / createdIds.size) * 10000) / 100 : 0;
      const advanceRate = monthCards.length > 0 ? Math.round((advancedIds.size / monthCards.length) * 10000) / 100 : 0;
      const commentsPerLead = monthCards.length > 0 ? Math.round((totalComments / monthCards.length) * 100) / 100 : 0;

      // ─── TME (First Contact Time) ──────────────────────────────
      // All monthCards are already filtered by created_at range
      const tmeCards = monthCards;

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
      const tmaCards = monthCards.filter((c: any) =>
        c.stage_id === "contratos" || c.stage_id === "geladeira"
      );

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
      const onb = makeExternalClient(ONBOARDING_URL, ONBOARDING_ANON_KEY, "ONBOARDING_SERVICE_KEY");
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

      // Avg onboarding days — mesma regra do Compass ("Indicadores do Mês → Tempo Médio"):
      // concluído = entrada até a última etapa concluída; em andamento = entrada até hoje (parcial)
      const nowMs = Date.now();
      const durationOf = (client: any): number => {
        const cs = stepsByClient.get(client.id) || [];
        const done = cs.length > 0 && cs.every((s: any) => s.status === "Ok");
        const entryMs = new Date(client.entry_date).getTime();
        if (done) {
          const dates = cs.filter((s: any) => s.completed_date).map((s: any) => new Date(s.completed_date).getTime());
          if (dates.length > 0) {
            return Math.max(0, Math.floor((Math.max(...dates) - entryMs) / 86400000));
          }
        }
        return Math.max(0, Math.floor((nowMs - entryMs) / 86400000));
      };

      const allDurations = clients.map(durationOf);
      const avgOnboardingDays = allDurations.length > 0
        ? Math.round(allDurations.reduce((a: number, b: number) => a + b, 0) / allDurations.length)
        : null;

      // Progresso do cliente (mesma regra do Compass): etapas "Ok" / total de etapas
      const progressOf = (client: any): number | null => {
        const cs = stepsByClient.get(client.id) || [];
        if (cs.length === 0) return null;
        return (cs.filter((s: any) => s.status === "Ok").length / cs.length) * 100;
      };
      const avgOf = (vals: (number | null)[]): number | null => {
        const v = vals.filter((x): x is number => x !== null);
        return v.length > 0 ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
      };
      const avgProgress = avgOf(clients.map(progressOf));

      // Métricas por mês de entrada do cliente
      const onboardingByMonth: Record<string, { avgOnboardingDays: number | null; complianceRate: number | null; avgProgress: number | null; totalClients: number; completedClients: number; isPartial: boolean }> = {};
      const clientsByMonth = new Map<string, any[]>();
      for (const c of clients) {
        const key = String(c.entry_date).substring(0, 7);
        if (!clientsByMonth.has(key)) clientsByMonth.set(key, []);
        clientsByMonth.get(key)!.push(c);
      }
      for (const [key, list] of clientsByMonth.entries()) {
        const durations = list.map(durationOf);
        const monthSteps = list.flatMap((c: any) => stepsByClient.get(c.id) || []);
        const withDates = monthSteps.filter((s: any) => s.status === "Ok" && s.completed_date && s.planned_date);
        const onTime = withDates.filter((s: any) => s.completed_date <= s.planned_date);
        const doneCount = list.filter((c: any) => {
          const cs = stepsByClient.get(c.id) || [];
          return cs.length > 0 && cs.every((s: any) => s.status === "Ok");
        }).length;
        onboardingByMonth[key] = {
          avgOnboardingDays: durations.length > 0 ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : null,
          complianceRate: withDates.length > 0 ? Math.round((onTime.length / withDates.length) * 100) : null,
          avgProgress: avgOf(list.map(progressOf)),
          totalClients: list.length,
          completedClients: doneCount,
          isPartial: doneCount < list.length,
        };
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
        avgProgress,
        reschedulingRate,
        activeClients: clients.length - completedClientIds.length,
        completedClients: completedClientIds.length,
        overallCompletion,
        byMonth: onboardingByMonth,
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
        nivel: string;
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
          nivel: cols[3]?.trim() || "",
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

      // Training hour target per level: Liderança=6, Time=5, Estagiários=4
      function getHoursTargetByLevel(nivel: string): number {
        const n = nivel.toLowerCase();
        if (n.includes("lideran")) return 6;
        if (n.includes("estagi")) return 4;
        return 5; // Time (default)
      }

      // Build a map of active collaborator name -> their level & target
      // Training sheet uses short names (e.g. "Adriano Gorgulho"), collab sheet has full names
      // Build multiple keys for matching: full name, first+second word, first+last word
      function getNameKeys(fullName: string): string[] {
        const parts = fullName.trim().split(/\s+/);
        const keys: string[] = [fullName.trim().toLowerCase()];
        if (parts.length >= 2) {
          keys.push(`${parts[0]} ${parts[1]}`.toLowerCase());
          if (parts.length > 2) {
            keys.push(`${parts[0]} ${parts[parts.length - 1]}`.toLowerCase());
          }
        }
        if (parts.length >= 1) {
          keys.push(parts[0].toLowerCase());
        }
        return keys;
      }

      const collabLevelByKey: Record<string, { nivel: string; hoursTarget: number }> = {};
      let totalHoursTarget = 0;
      for (const c of activeCollabs) {
        const target = getHoursTargetByLevel(c.nivel);
        const entry = { nivel: c.nivel, hoursTarget: target };
        for (const key of getNameKeys(c.nome)) {
          if (!collabLevelByKey[key]) {
            collabLevelByKey[key] = entry;
          }
        }
        totalHoursTarget += target;
      }

      // Lookup function: tries all name key variants
      function lookupLevel(name: string): { nivel: string; hoursTarget: number } | undefined {
        for (const key of getNameKeys(name)) {
          if (collabLevelByKey[key]) return collabLevelByKey[key];
        }
        return undefined;
      }

      // Targets (all dynamic based on actual headcount)
      const HEADCOUNT_TARGET = headcount;
      const HOURS_TARGET = totalHoursTarget;
      const MODULES_TARGET = headcount * 2;
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

      // Top collaborators sorted by hours (convert Set to count), include level target
      const topCollaborators = Object.entries(byCollaborator)
        .map(([name, data]) => {
          const levelInfo = lookupLevel(name);
          return {
            name,
            hours: data.hours,
            modules: data.modules.size,
            certified: data.certified,
            nivel: levelInfo?.nivel || "",
            hoursTarget: levelInfo?.hoursTarget || 5,
          };
        })
        .sort((a, b) => b.hours - a.hours);

      // Trained headcount: collaborators who completed at least 1 training
      const trainedHeadcount = topCollaborators.filter(c => c.modules > 0).length;

      // All active collaborators with their level info (including those with no training)
      const allCollaborators = activeCollabs.map(c => {
        const trained = topCollaborators.find(tc => {
          // Match by name keys
          const tcKeys = getNameKeys(tc.name);
          const cKeys = getNameKeys(c.nome);
          return tcKeys.some(k => cKeys.includes(k));
        });
        return {
          name: c.nome.split(" ").slice(0, 2).join(" "),
          fullName: c.nome,
          nivel: c.nivel,
          hoursTarget: getHoursTargetByLevel(c.nivel),
          hours: trained?.hours || 0,
          modules: trained?.modules || 0,
        };
      });

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
        trainedHeadcount,
        avgMonths: avgTenureMonths,
        byMonth: trainingByMonth,
        totalHours,
        totalModules,
        totalCertified,
        certificationRate,
        topCollaborators,
        allCollaborators,
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

    // ─── Dashboard-style cumulative counts (matches Pipeline Dashboard panel) ───
    // Uses `month` field filtering and cumulative counting:
    // A card counts for a stage if it's (a) currently at that stage, (b) has history to that stage, or (c) at a later stage
    const DASHBOARD_FUNNEL = ["leads", "reunioes", "propostas", "r2", "contratos"];

    function computeCumulative(filteredCards: any[], stageId: string): { count: number; names: string[] } {
      const uniqueCards = new Set<string>();
      const namesList: string[] = [];
      const stageIdx = DASHBOARD_FUNNEL.indexOf(stageId);

      // Cards currently at this stage
      for (const c of filteredCards) {
        if (c.stage_id === stageId) uniqueCards.add(c.id);
      }
      // Cards that passed through this stage (history)
      const filteredIds = new Set(filteredCards.map((c: any) => c.id));
      for (const h of stageHistory) {
        if (h.to_stage === stageId && filteredIds.has(h.card_id)) {
          uniqueCards.add(h.card_id);
        }
      }
      // Cards at later stages
      for (const c of filteredCards) {
        const cardIdx = DASHBOARD_FUNNEL.indexOf(c.stage_id);
        if (cardIdx > stageIdx) uniqueCards.add(c.id);
      }

      for (const id of uniqueCards) {
        const card = cardById.get(id);
        namesList.push(card?.title ?? id);
      }
      return { count: uniqueCards.size, names: namesList };
    }

    // Contratos in Dashboard = snapshot count (cards currently in contratos), deduplicated
    function computeContratosSnapshot(filteredCards: any[]): { count: number; names: string[] } {
      const u = uniqueContratos(filteredCards);
      return { count: u.count, names: u.names };
    }

    interface DashboardMonthData {
      leads: number;
      reunioes: number;
      propostas: number;
      r2: number;
      contratos: number;
      prospects: number;
      valor_gerado: number;
      conversao: number;
      taxaAgendamento: number;
      taxaComparecimento: number;
      avgCloseTimeDays: number | null;
      tmeMinutes: number | null;
      tmaDays: number | null;
      tarefasRealizadas: number;
    }

    const dashboardByMonth: Record<string, DashboardMonthData> = {};
    // Dashboard leads/prospects/contratos/valor_gerado by origin per month
    // `leads` = Pipeline Dashboard "Leads no Funil" (stage NOT in prospects/geladeira), includes ghosts
    const dashboardByOriginMonth: Record<string, Record<string, { leads: number; prospects: number; contratos: number; valor_gerado: number }>> = {};
    // Same `leads` semantics, split by practice_area
    const dashboardByOriginAreaMonth: Record<string, Record<string, Record<string, { leads: number; contratos: number; valor_gerado: number }>>> = {};
    // Pipeline Dashboard "Novos Leads" (!ghost_of && created_at month === ms && stage NOT in prospects/geladeira), by origin × area
    const novosByOriginAreaMonth: Record<string, Record<string, { empresarial: number; trabalhista: number; tributario: number; total: number }>> = {};
    // Lead scoring (MQL/SQL) direto do Pipeline Vision Board, por origem
    const qualificacaoByOriginMonth: Record<string, Record<string, { mql: number; sql: number }>> = {};
    const qualificacaoTotalsByOrigin: Record<string, { mql: number; sql: number }> = {};
    const countClass = (list: any[], cls: string) =>
      list.filter((c: any) => classByCard.get(c.id) === cls).length;

    for (const ms of monthStrings) {
      // Dashboard uses `month` field filtering
      const monthFilteredCards = cards.filter((c: any) => c.month === ms);

      const leads = computeCumulative(monthFilteredCards, "leads");
      const reunioes = computeCumulative(monthFilteredCards, "reunioes");
      const propostas = computeCumulative(monthFilteredCards, "propostas");
      const r2 = computeCumulative(monthFilteredCards, "r2");
      const contratosSnap = computeContratosSnapshot(monthFilteredCards);
      const prospects = monthFilteredCards.filter((c: any) => c.stage_id === "prospects").length;

      // Valor gerado (deduplicated)
      const contractCards = monthFilteredCards.filter((c: any) => c.stage_id === "contratos" && c.contract_value);
      const valorGerado = deduplicatedValorGerado(contractCards);

      // Conversão = contratos snapshot / leads cumulative * 100
      const conversao = leads.count > 0 ? Math.round((contratosSnap.count / leads.count) * 10000) / 100 : 0;
      const taxaAgendamento = leads.count > 0 ? Math.round((reunioes.count / leads.count) * 10000) / 100 : 0;
      const taxaComparecimento = reunioes.count > 0 ? Math.round((propostas.count / reunioes.count) * 10000) / 100 : 0;

      // Avg close time (matching Dashboard)
      const contratosCards = monthFilteredCards.filter((c: any) => c.stage_id === "contratos");
      let closeTotal = 0, closeN = 0;
      for (const c of contratosCards) {
        const entry = (historyByCard[c.id] || [])
          .filter((h: any) => h.to_stage === "contratos")
          .sort((a: any, b: any) => new Date(b.moved_at).getTime() - new Date(a.moved_at).getTime())[0];
        if (entry && c.created_at) {
          const days = Math.max(0, Math.floor((new Date(entry.moved_at).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)));
          closeTotal += days; closeN++;
        }
      }

      // TME (minutes) - matching Dashboard computeTme
      const tmeCards = monthFilteredCards.filter((c: any) => !c.ghost_of);
      const tmeValues: number[] = [];
      for (const c of tmeCards) {
        const created = new Date(c.created_at).getTime();
        const firstComment = (commentsByCard.get(c.id) || [])
          .map((cm: any) => new Date(cm.created_at).getTime())
          .filter((t: number) => t > created)
          .sort((a: number, b: number) => a - b)[0];
        const firstMove = (historyByCard[c.id] || [])
          .map((h: any) => new Date(h.moved_at).getTime())
          .filter((t: number) => t > created)
          .sort((a: number, b: number) => a - b)[0];
        const candidates = [firstComment, firstMove].filter(Boolean) as number[];
        if (candidates.length > 0) {
          tmeValues.push(Math.max(0, Math.round((Math.min(...candidates) - created) / (1000 * 60))));
        }
      }
      const tmeAvg = tmeValues.length > 0 ? Math.round(tmeValues.reduce((a, b) => a + b, 0) / tmeValues.length) : null;

      // TMA (days) — mesma regra do Pipeline Vision Board (inclui cards abertos)
      const tmaAvg = computeTmaDays(monthFilteredCards, historyByCard);

      // Tarefas realizadas = creations + comments + moves in this month
      const [y, m] = ms.split("-").map(Number);
      const trRangeStart = new Date(y, m - 1, 1);
      const trRangeEnd = new Date(y, m, 1);
      const inTrRange = (dateStr: string) => { const d = new Date(dateStr); return d >= trRangeStart && d < trRangeEnd; };
      const companyCardIds = new Set(cards.map((c: any) => c.id));
      const creations = cards.filter((c: any) => !c.ghost_of && inTrRange(c.created_at)).length;
      const comments = cardComments.filter((cm: any) => companyCardIds.has(cm.card_id) && inTrRange(cm.created_at)).length;
      const moves = stageHistory.filter((h: any) => companyCardIds.has(h.card_id) && inTrRange(h.moved_at)).length;

      dashboardByMonth[ms] = {
        leads: leads.count,
        reunioes: reunioes.count,
        propostas: propostas.count,
        r2: r2.count,
        contratos: contratosSnap.count,
        prospects,
        valor_gerado: valorGerado,
        conversao,
        taxaAgendamento,
        taxaComparecimento,
        avgCloseTimeDays: closeN > 0 ? Math.round(closeTotal / closeN) : null,
        tmeMinutes: tmeAvg,
        tmaDays: tmaAvg,
        tarefasRealizadas: creations + comments + moves,
      };

      // Dashboard leads/contratos by origin — matches Pipeline Vision Board
      dashboardByOriginMonth[ms] = {};
      dashboardByOriginAreaMonth[ms] = {};
      novosByOriginAreaMonth[ms] = {} as any;

      const [yy, mm] = ms.split("-").map(Number);
      const periodStart = new Date(yy, mm - 1, 1);
      const periodEnd = new Date(yy, mm, 1);

      // Novos: !ghost && created_at in period && current stage in funnel
      const novosAll = cards.filter((c: any) => {
        if (c.ghost_of) return false;
        if (!isFunnelStage(c.stage_id)) return false;
        const d = new Date(c.created_at);
        return d >= periodStart && d < periodEnd;
      });

      // Leads no Funil (definição exata do Pipeline Vision Board):
      // cards do mês selecionado (campo `month`), não-ghost, cuja etapa ATUAL está no funil
      // (exclui prospects e geladeira). Sem histórico/janela temporal.
      const funilAll = monthFilteredCards.filter((c: any) => !c.ghost_of && isFunnelStage(c.stage_id));

      for (const origin of ["online", "offline"]) {
        const isOriginMatch = origin === "online"
          ? (c: any) => c.lead_origin === "online"
          : (c: any) => c.lead_origin !== "online";

        const originCards = monthFilteredCards.filter(isOriginMatch);
        const funilOriginCards = funilAll.filter(isOriginMatch);
        const oFunilLeads = funilOriginCards.length;
        const oProspects = originCards.filter((c: any) => c.stage_id === "prospects").length;
        const oContratosSnap = uniqueContratos(originCards);
        const oContratos = oContratosSnap.count;
        const oValorGerado = deduplicatedValorGerado(oContratosSnap.cards.filter((c: any) => c.contract_value));
        dashboardByOriginMonth[ms][origin] = { leads: oFunilLeads, prospects: oProspects, contratos: oContratos, valor_gerado: oValorGerado };

        // MQL/SQL (lead scoring do Pipeline) — cards do mês, por origem
        if (!qualificacaoByOriginMonth[ms]) qualificacaoByOriginMonth[ms] = {};
        qualificacaoByOriginMonth[ms][origin] = {
          mql: countClass(originCards, "MQL"),
          sql: countClass(originCards, "SQL"),
        };

        // By area (funil VB definition for leads; contratos snapshot from monthFilteredCards)
        dashboardByOriginAreaMonth[ms][origin] = {};
        const areasInOrigin = new Set<string>();
        for (const c of originCards) areasInOrigin.add(c.practice_area || "outros");
        for (const c of funilOriginCards) areasInOrigin.add(c.practice_area || "outros");
        for (const area of areasInOrigin) {
          const areaFunilCards = funilOriginCards.filter((c: any) => (c.practice_area || "outros") === area);
          const areaAllOrigin = originCards.filter((c: any) => (c.practice_area || "outros") === area);
          const aContratosSnap = uniqueContratos(areaAllOrigin);
          const aValorGerado = deduplicatedValorGerado(aContratosSnap.cards.filter((c: any) => c.contract_value));
          dashboardByOriginAreaMonth[ms][origin][area] = {
            leads: areaFunilCards.length,
            contratos: aContratosSnap.count,
            valor_gerado: aValorGerado,
          };
        }

        // Novos by area
        const novosOrigin = novosAll.filter(isOriginMatch);
        novosByOriginAreaMonth[ms][origin] = {
          empresarial: novosOrigin.filter((c: any) => c.practice_area === "empresarial").length,
          trabalhista: novosOrigin.filter((c: any) => c.practice_area === "trabalhista").length,
          tributario: novosOrigin.filter((c: any) => c.practice_area === "tributario").length,
          ambiental: novosOrigin.filter((c: any) => c.practice_area === "ambiental").length,
          total: novosOrigin.length,
        } as any;
      }
    }

    // Dashboard yearly totals
    const dashboardTotals: DashboardMonthData = {
      leads: 0, reunioes: 0, propostas: 0, r2: 0, contratos: 0, prospects: 0, valor_gerado: 0,
      conversao: 0, taxaAgendamento: 0, taxaComparecimento: 0,
      avgCloseTimeDays: null, tmeMinutes: null, tmaDays: null, tarefasRealizadas: 0,
    };
    {
      const allMonthCards = cards.filter((c: any) => monthStrings.includes(c.month));
      const tLeads = computeCumulative(allMonthCards, "leads");
      const tReunioes = computeCumulative(allMonthCards, "reunioes");
      const tPropostas = computeCumulative(allMonthCards, "propostas");
      const tR2 = computeCumulative(allMonthCards, "r2");
      const tContratos = computeContratosSnapshot(allMonthCards);
      dashboardTotals.leads = tLeads.count;
      dashboardTotals.reunioes = tReunioes.count;
      dashboardTotals.propostas = tPropostas.count;
      dashboardTotals.r2 = tR2.count;
      dashboardTotals.contratos = tContratos.count;
      dashboardTotals.prospects = allMonthCards.filter((c: any) => c.stage_id === "prospects").length;
      dashboardTotals.valor_gerado = deduplicatedValorGerado(allMonthCards.filter((c: any) => c.stage_id === "contratos"));
      dashboardTotals.conversao = tLeads.count > 0 ? Math.round((tContratos.count / tLeads.count) * 10000) / 100 : 0;
      dashboardTotals.taxaAgendamento = tLeads.count > 0 ? Math.round((tReunioes.count / tLeads.count) * 10000) / 100 : 0;
      dashboardTotals.taxaComparecimento = tReunioes.count > 0 ? Math.round((tPropostas.count / tReunioes.count) * 10000) / 100 : 0;

      // Totals TME/TMA/close
      const tmeVals: number[] = [];
      const tmaTotal = computeTmaDays(allMonthCards, historyByCard);
      let closeTotalY = 0, closeNY = 0;
      for (const c of allMonthCards) {
        if (!c.ghost_of) {
          const created = new Date(c.created_at).getTime();
          const fc = (commentsByCard.get(c.id) || []).map((cm: any) => new Date(cm.created_at).getTime()).filter((t: number) => t > created).sort((a: number, b: number) => a - b)[0];
          const fm = (historyByCard[c.id] || []).map((h: any) => new Date(h.moved_at).getTime()).filter((t: number) => t > created).sort((a: number, b: number) => a - b)[0];
          const cands = [fc, fm].filter(Boolean) as number[];
          if (cands.length > 0) tmeVals.push(Math.max(0, Math.round((Math.min(...cands) - created) / (1000 * 60))));
        }
        if (c.stage_id === "contratos") {
          const entry = (historyByCard[c.id] || []).filter((h: any) => h.to_stage === "contratos").sort((a: any, b: any) => new Date(b.moved_at).getTime() - new Date(a.moved_at).getTime())[0];
          if (entry) { const d = Math.max(0, Math.floor((new Date(entry.moved_at).getTime() - new Date(c.created_at).getTime()) / (1000*60*60*24))); closeTotalY += d; closeNY++; }
        }
      }
      dashboardTotals.tmeMinutes = tmeVals.length > 0 ? Math.round(tmeVals.reduce((a, b) => a + b, 0) / tmeVals.length) : null;
      dashboardTotals.tmaDays = tmaTotal;
      dashboardTotals.avgCloseTimeDays = closeNY > 0 ? Math.round(closeTotalY / closeNY) : null;
      // Tarefas totals
      let totalTarefas = 0;
      for (const md of Object.values(dashboardByMonth)) totalTarefas += md.tarefasRealizadas;
      dashboardTotals.tarefasRealizadas = totalTarefas;
    }

    // Dashboard totals by origin (Pipeline Dashboard "Leads no Funil" definition)
    const dashboardTotalsByOrigin: Record<string, { leads: number; prospects: number; contratos: number; valor_gerado: number }> = {};
    const dashboardTotalsByOriginArea: Record<string, Record<string, { leads: number; contratos: number; valor_gerado: number }>> = {};
    const novosTotalsByOriginArea: Record<string, { empresarial: number; trabalhista: number; tributario: number; total: number }> = {} as any;
    {
      const allMonthCards = cards.filter((c: any) => monthStrings.includes(c.month));
      // Range = primeiro mês até fim do último mês
      const sortedMs = [...monthStrings].sort();
      const [y0, m0] = sortedMs[0].split("-").map(Number);
      const [yN, mN] = sortedMs[sortedMs.length - 1].split("-").map(Number);
      const rangeStart = new Date(y0, m0 - 1, 1);
      const rangeEnd = new Date(yN, mN, 1);

      // Novos: !ghost && created_at in range && stage NOT in prospects/geladeira
      const novosAllY = cards.filter((c: any) => {
        if (c.ghost_of) return false;
        if (!isFunnelStage(c.stage_id)) return false;
        const d = new Date(c.created_at);
        return d >= rangeStart && d < rangeEnd;
      });

      // Leads no Funil (definição exata do Pipeline Vision Board): cards dos meses do range
      // (campo `month`), não-ghost, cuja etapa ATUAL está no funil
      const funilAllY = allMonthCards.filter((c: any) => !c.ghost_of && isFunnelStage(c.stage_id));

      for (const origin of ["online", "offline"]) {
        const isOriginMatch = origin === "online"
          ? (c: any) => c.lead_origin === "online"
          : (c: any) => c.lead_origin !== "online";

        const originCards = allMonthCards.filter(isOriginMatch);
        const funilOriginCards = funilAllY.filter(isOriginMatch);
        const oFunilLeads = funilOriginCards.length;
        const oProspects = originCards.filter((c: any) => c.stage_id === "prospects").length;
        const oContratosSnap = uniqueContratos(originCards);
        const oContratos = oContratosSnap.count;
        const oValorGerado = deduplicatedValorGerado(oContratosSnap.cards.filter((c: any) => c.contract_value));
        dashboardTotalsByOrigin[origin] = { leads: oFunilLeads, prospects: oProspects, contratos: oContratos, valor_gerado: oValorGerado };
        qualificacaoTotalsByOrigin[origin] = {
          mql: countClass(originCards, "MQL"),
          sql: countClass(originCards, "SQL"),
        };

        dashboardTotalsByOriginArea[origin] = {};
        const areasInOrigin = new Set<string>();
        for (const c of originCards) areasInOrigin.add(c.practice_area || "outros");
        for (const c of funilOriginCards) areasInOrigin.add(c.practice_area || "outros");
        for (const area of areasInOrigin) {
          const areaFunil = funilOriginCards.filter((c: any) => (c.practice_area || "outros") === area);
          const areaAllOrigin = originCards.filter((c: any) => (c.practice_area || "outros") === area);
          const aContratosSnap = uniqueContratos(areaAllOrigin);
          const aValorGerado = deduplicatedValorGerado(aContratosSnap.cards.filter((c: any) => c.contract_value));
          dashboardTotalsByOriginArea[origin][area] = {
            leads: areaFunil.length,
            contratos: aContratosSnap.count,
            valor_gerado: aValorGerado,
          };
        }

        const novosOrigin = novosAllY.filter(isOriginMatch);
        novosTotalsByOriginArea[origin] = {
          empresarial: novosOrigin.filter((c: any) => c.practice_area === "empresarial").length,
          trabalhista: novosOrigin.filter((c: any) => c.practice_area === "trabalhista").length,
          tributario: novosOrigin.filter((c: any) => c.practice_area === "tributario").length,
          ambiental: novosOrigin.filter((c: any) => c.practice_area === "ambiental").length,
          total: novosOrigin.length,
        } as any;
      }
    }

    // Build response payload
    const payload: any = {
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
      cardNames,
      cardNamesByArea,
      cardNamesByAreaTag,
      dashboard: dashboardByMonth,
      dashboardTotals,
      dashboardByOrigin: dashboardByOriginMonth,
      dashboardTotalsByOrigin,
      dashboardByOriginArea: dashboardByOriginAreaMonth,
      dashboardTotalsByOriginArea,
      novosByOriginArea: novosByOriginAreaMonth,
      novosTotalsByOriginArea,
      qualificacaoByOrigin: qualificacaoByOriginMonth,
      qualificacaoTotalsByOrigin,
      leadScoresDebug: {
        count: leadScores.length,
        classes: Array.from(new Set(leadScores.map((l: any) => l.classificacao))),
      },
    };

    // ---------- Month snapshot overlay (freeze closed months) ----------
    const skipSnapshots = req.headers.get("x-skip-snapshots") === "1" || url.searchParams.get("skip_snapshots") === "1";
    if (!skipSnapshots) {
      try {
        const SB_URL = Deno.env.get("SUPABASE_URL");
        const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
        if (SB_URL && SB_KEY) {
          const sb = createClient(SB_URL, SB_KEY);
          let q = sb.from("month_snapshots").select("year,month,payload").eq("source", "pipeline").eq("year", year);
          if (month) q = q.eq("month", month);
          const { data: snaps } = await q;
          if (snaps && snaps.length) {
            for (const s of snaps) {
              const ms = `${s.year}-${String(s.month).padStart(2, "0")}`;
              const sp: any = s.payload || {};
              if (sp.months !== undefined) payload.months[ms] = sp.months;
              if (sp.dashboard !== undefined) payload.dashboard[ms] = sp.dashboard;
              if (sp.dashboardByOrigin !== undefined) payload.dashboardByOrigin[ms] = sp.dashboardByOrigin;
              if (sp.dashboardByOriginArea !== undefined) {
                payload.dashboardByOriginArea = payload.dashboardByOriginArea || {};
                payload.dashboardByOriginArea[ms] = sp.dashboardByOriginArea;
              }
              if (sp.novosByOriginArea !== undefined) {
                payload.novosByOriginArea = payload.novosByOriginArea || {};
                payload.novosByOriginArea[ms] = sp.novosByOriginArea;
              }
              if (sp.avgCloseDays !== undefined) payload.avgCloseDaysByMonth[ms] = sp.avgCloseDays;
              if (sp.operational !== undefined) payload.operational[ms] = sp.operational;
              if (sp.cardNames !== undefined) payload.cardNames[ms] = sp.cardNames;
              if (sp.byArea) {
                for (const a of Object.keys(sp.byArea)) {
                  payload.byArea[a] = payload.byArea[a] || {};
                  payload.byArea[a][ms] = sp.byArea[a];
                }
              }
              if (sp.byAreaTag) {
                for (const a of Object.keys(sp.byAreaTag)) {
                  payload.byAreaTag[a] = payload.byAreaTag[a] || {};
                  for (const t of Object.keys(sp.byAreaTag[a])) {
                    payload.byAreaTag[a][t] = payload.byAreaTag[a][t] || {};
                    payload.byAreaTag[a][t][ms] = sp.byAreaTag[a][t];
                  }
                }
              }
              if (sp.cardNamesByArea) {
                for (const a of Object.keys(sp.cardNamesByArea)) {
                  payload.cardNamesByArea[a] = payload.cardNamesByArea[a] || {};
                  payload.cardNamesByArea[a][ms] = sp.cardNamesByArea[a];
                }
              }
              if (sp.cardNamesByAreaTag) {
                for (const a of Object.keys(sp.cardNamesByAreaTag)) {
                  payload.cardNamesByAreaTag[a] = payload.cardNamesByAreaTag[a] || {};
                  for (const t of Object.keys(sp.cardNamesByAreaTag[a])) {
                    payload.cardNamesByAreaTag[a][t] = payload.cardNamesByAreaTag[a][t] || {};
                    payload.cardNamesByAreaTag[a][t][ms] = sp.cardNamesByAreaTag[a][t];
                  }
                }
              }
              if (sp.training && payload.training) {
                if (sp.training.byMonth !== undefined) {
                  payload.training.byMonth = payload.training.byMonth || {};
                  payload.training.byMonth[ms] = sp.training.byMonth;
                }
                if (sp.training.byCollaboratorMonth) {
                  payload.training.byCollaboratorMonth = payload.training.byCollaboratorMonth || {};
                  for (const c of Object.keys(sp.training.byCollaboratorMonth)) {
                    payload.training.byCollaboratorMonth[c] = payload.training.byCollaboratorMonth[c] || {};
                    payload.training.byCollaboratorMonth[c][ms] = sp.training.byCollaboratorMonth[c];
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Snapshot overlay failed:", e);
      }
    }

    return new Response(
      JSON.stringify(payload),
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
