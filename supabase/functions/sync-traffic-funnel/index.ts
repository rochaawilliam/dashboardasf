import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRqr_x36mGLJC8-2aTAPPD0opl3txAiAnEmjwtJJI5f5jEy70XVdeAPhgl85HlJMg/pub?gid=1235459084&single=true&output=csv";

interface MonthData {
  valor_investido: number;
  impressoes: number;
  alcance: number;
  cliques_saida: number;
  conversas_iniciadas: number;
  custo_por_conversa: number;
  meta_valor_investido: number;
  meta_conversas_iniciadas: number;
  google_valor_investido: number;
  google_impressoes: number;
  google_cliques: number;
  google_conversoes: number;
}

export interface TrafficFunnelData {
  months: Record<string, MonthData>;
  totals: MonthData;
  year: number;
}

const MONTH_MAP: Record<string, string> = {
  janeiro: "01",
  fevereiro: "02",
  março: "03",
  marco: "03",
  abril: "04",
  maio: "05",
  junho: "06",
  julho: "07",
  agosto: "08",
  setembro: "09",
  outubro: "10",
  novembro: "11",
  dezembro: "12",
};

function parseBRNumber(str: string): number {
  if (!str) return 0;
  // Remove "R$ ", dots (thousands), replace comma with dot
  const cleaned = str
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csv: string, filterYear: number): TrafficFunnelData {
  const lines = csv.split("\n").map((l) => l.trim());
  const months: Record<string, MonthData> = {};

  let currentMonth: string | null = null;
  let currentYear = 0;
  const current: Partial<MonthData> = {};

  const flush = () => {
    if (currentMonth && currentYear === filterYear) {
      const key = `${currentYear}-${currentMonth}`;
      const metaInvest = current.meta_valor_investido ?? 0;
      const metaConversas = current.meta_conversas_iniciadas ?? 0;
      const gInvest = current.google_valor_investido ?? 0;
      const gConv = current.google_conversoes ?? 0;
      const totalInvest = metaInvest + gInvest;
      const totalConversas = metaConversas + gConv;
      months[key] = {
        valor_investido: totalInvest,
        impressoes: (current.impressoes ?? 0) + (current.google_impressoes ?? 0),
        alcance: current.alcance ?? 0,
        cliques_saida: (current.cliques_saida ?? 0) + (current.google_cliques ?? 0),
        conversas_iniciadas: totalConversas,
        custo_por_conversa: totalConversas > 0 ? totalInvest / totalConversas : 0,
        meta_valor_investido: metaInvest,
        meta_conversas_iniciadas: metaConversas,
        google_valor_investido: gInvest,
        google_impressoes: current.google_impressoes ?? 0,
        google_cliques: current.google_cliques ?? 0,
        google_conversoes: gConv,
      };
    }
    currentMonth = null;
    currentYear = 0;
    Object.keys(current).forEach((k) => delete (current as any)[k]);
  };

  for (const line of lines) {
    const cols = parseCSVLine(line);
    const first = cols[0]?.toUpperCase() || "";
    const gLabel = (cols[4] || "").toUpperCase().trim();
    const gValue = cols[6] || cols[5] || "";

    // Google (side block) metrics for the current month
    if (currentMonth && gLabel && !gLabel.startsWith("FUNIL DE ")) {
      if (gLabel.includes("VALOR INVESTIDO")) current.google_valor_investido = parseBRNumber(gValue);
      else if (gLabel.includes("IMPRESS")) current.google_impressoes = parseBRNumber(gValue);
      else if (gLabel.includes("CLIQUES")) current.google_cliques = parseBRNumber(gValue);
      else if (gLabel.includes("CONVERS") && !gLabel.includes("CUSTO")) current.google_conversoes = parseBRNumber(gValue);
    }

    // Detect "FUNIL DE <MONTH> [DE <YEAR>]"
    if (first.startsWith("FUNIL DE ")) {
      flush();
      const rest = first.replace("FUNIL DE ", "").toLowerCase();
      // Extract year if present
      const yearMatch = rest.match(/(\d{4})/);
      if (yearMatch) {
        currentYear = parseInt(yearMatch[1]);
      } else {
        // Default: months without year in CSV are 2025
        currentYear = 2025;
      }
      // Extract month
      for (const [name, num] of Object.entries(MONTH_MAP)) {
        if (rest.includes(name)) {
          currentMonth = num;
          break;
        }
      }
      continue;
    }

    if (!currentMonth) continue;

    const label = first;
    const value = cols[2] || cols[1] || "";

    if (label.includes("VALOR INVESTIDO")) current.meta_valor_investido = parseBRNumber(value);
    else if (label.includes("IMPRESSÕES")) current.impressoes = parseBRNumber(value);
    else if (label.includes("ALCANCE")) current.alcance = parseBRNumber(value);
    else if (label.includes("CLIQUES")) current.cliques_saida = parseBRNumber(value);
    else if (label.includes("CONVERSAS INICIADAS")) current.meta_conversas_iniciadas = parseBRNumber(value);
    else if (label.includes("CUSTO POR CONVERSA")) current.custo_por_conversa = parseBRNumber(value);
  }
  flush();

  // Compute totals
  const totals: MonthData = {
    valor_investido: 0,
    impressoes: 0,
    alcance: 0,
    cliques_saida: 0,
    conversas_iniciadas: 0,
    custo_por_conversa: 0,
    meta_valor_investido: 0,
    meta_conversas_iniciadas: 0,
    google_valor_investido: 0,
    google_impressoes: 0,
    google_cliques: 0,
    google_conversoes: 0,
  };
  const monthKeys = Object.keys(months);
  for (const data of Object.values(months)) {
    totals.valor_investido += data.valor_investido;
    totals.impressoes += data.impressoes;
    totals.alcance += data.alcance;
    totals.cliques_saida += data.cliques_saida;
    totals.conversas_iniciadas += data.conversas_iniciadas;
    totals.meta_valor_investido += data.meta_valor_investido ?? 0;
    totals.meta_conversas_iniciadas += data.meta_conversas_iniciadas ?? 0;
    totals.google_valor_investido += data.google_valor_investido ?? 0;
    totals.google_impressoes += data.google_impressoes ?? 0;
    totals.google_cliques += data.google_cliques ?? 0;
    totals.google_conversoes += data.google_conversoes ?? 0;
  }
  if (monthKeys.length > 0) {
    totals.custo_por_conversa =
      totals.conversas_iniciadas > 0
        ? totals.valor_investido / totals.conversas_iniciadas
        : 0;
  }

  return { months, totals, year: filterYear };
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

    const res = await fetch(CSV_URL, { signal: AbortSignal.timeout(20000), redirect: "follow" });
    if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
    const csv = await res.text();

    const data = parseCSV(csv, year);

    // Overlay closed-month snapshots
    const skipSnapshots = req.headers.get("x-skip-snapshots") === "1" || url.searchParams.get("skip_snapshots") === "1";
    if (!skipSnapshots) {
      try {
        const SB_URL = Deno.env.get("SUPABASE_URL");
        const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
        if (SB_URL && SB_KEY) {
          const sb = createClient(SB_URL, SB_KEY);
          const { data: snaps } = await sb
            .from("month_snapshots")
            .select("year,month,payload")
            .eq("source", "traffic_funnel")
            .eq("year", year);
          if (snaps && snaps.length) {
            for (const s of snaps) {
              const ms = `${s.year}-${String(s.month).padStart(2, "0")}`;
              const sp: any = s.payload || {};
              if (sp.months !== undefined) data.months[ms] = sp.months;
            }
            // Recompute totals from (possibly frozen) monthly slices
            const t: MonthData = { valor_investido: 0, impressoes: 0, alcance: 0, cliques_saida: 0, conversas_iniciadas: 0, custo_por_conversa: 0, meta_valor_investido: 0, meta_conversas_iniciadas: 0, google_valor_investido: 0, google_impressoes: 0, google_cliques: 0, google_conversoes: 0 };
            for (const m of Object.values(data.months)) {
              t.valor_investido += m.valor_investido;
              t.impressoes += m.impressoes;
              t.alcance += m.alcance;
              t.cliques_saida += m.cliques_saida;
              t.conversas_iniciadas += m.conversas_iniciadas;
              t.meta_valor_investido += m.meta_valor_investido ?? 0;
              t.meta_conversas_iniciadas += m.meta_conversas_iniciadas ?? 0;
              t.google_valor_investido += m.google_valor_investido ?? 0;
              t.google_impressoes += m.google_impressoes ?? 0;
              t.google_cliques += m.google_cliques ?? 0;
              t.google_conversoes += m.google_conversoes ?? 0;
            }
            t.custo_por_conversa = t.conversas_iniciadas > 0 ? t.valor_investido / t.conversas_iniciadas : 0;
            data.totals = t;
          }
        }
      } catch (e) {
        console.error("Traffic snapshot overlay failed:", e);
      }
    }

    return new Response(JSON.stringify(data), { headers, status: 200 });
  } catch (err) {
    console.error("sync-traffic-funnel error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers,
      status: 500,
    });
  }
});
