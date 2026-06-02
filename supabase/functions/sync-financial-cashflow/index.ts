import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface CashflowMonthData {
  recebimentos_dinheiro_pix: number;
  total_recebimentos: number;
  total_pagamentos: number;
  folha_total: number;
  lucratividade_pct: number; // (receb - pagam) / receb * 100
  folha_sobre_receita_pct: number;
}

export interface CashflowResponse {
  months: Record<string, CashflowMonthData>;
  year: number;
  errors: Record<string, string>;
}

function parseBRNumber(str: string): number {
  if (!str) return 0;
  const cleaned = String(str)
    .replace(/R\$\s*/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.\-]/g, "")
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') q = !q;
    else if (ch === "," && !q) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

// Folha / encargos / benefícios = "custo de pessoal"
const FOLHA_PATTERNS = [
  /^folha de pagamento/i,
  /^bolsa.?aux/i,
  /^aux[íi]lio.?transporte/i,
  /^vale.?alimenta/i,
  /^fgts/i,
  /^inss/i,
  /^repasse advogados/i,
  /^comiss[ãa]o/i,
  /^comissionamento/i,
];

function isFolhaLabel(label: string): boolean {
  const l = label.trim();
  return FOLHA_PATTERNS.some((re) => re.test(l));
}

function parseSheet(csv: string): CashflowMonthData {
  const lines = csv.split("\n").map((l) => l.trim());
  let receb_dinheiro = 0;
  let receb_pix = 0;
  let total_recebimentos = 0;
  let total_pagamentos = 0;
  let folha_total = 0;

  let section: "header" | "recebimentos" | "pagamentos" | "outros" = "header";

  for (const raw of lines) {
    if (!raw) continue;
    const cols = parseCSVLine(raw);
    const label = (cols[0] || "").trim();
    const labelUpper = label.toUpperCase();
    // Total is the LAST non-empty column (usually rightmost). We pick the last cell with a value.
    let totalCell = "";
    for (let i = cols.length - 1; i >= 1; i--) {
      const v = (cols[i] || "").trim();
      if (v && v !== "0" && v !== "R$ 0,00" && v !== '"R$ 0,00"') {
        totalCell = v;
        break;
      }
      if (v) {
        totalCell = v;
        break;
      }
    }

    if (labelUpper === "RECEBIMENTOS") {
      section = "recebimentos";
      continue;
    }
    if (labelUpper === "PAGAMENTOS") {
      section = "pagamentos";
      continue;
    }
    if (labelUpper.startsWith("OUTROS DADOS")) {
      section = "outros";
      continue;
    }

    if (labelUpper === "TOTAL DE RECEBIMENTOS") {
      total_recebimentos = parseBRNumber(totalCell);
      section = "header"; // entre seções
      continue;
    }
    if (labelUpper === "TOTAL DE PAGAMENTOS") {
      total_pagamentos = parseBRNumber(totalCell);
      section = "header";
      continue;
    }

    if (section === "recebimentos") {
      if (/^dinheiro/i.test(label)) {
        receb_dinheiro = parseBRNumber(totalCell);
      } else if (/^pix/i.test(label)) {
        receb_pix = parseBRNumber(totalCell);
      }
    } else if (section === "pagamentos") {
      if (isFolhaLabel(label)) {
        folha_total += parseBRNumber(totalCell);
      }
    }
  }

  const receb = receb_dinheiro + receb_pix;
  const lucratividade_pct = receb > 0
    ? Math.round(((receb - total_pagamentos) / receb) * 10000) / 100
    : 0;
  const folha_sobre_receita_pct = receb > 0
    ? Math.round((folha_total / receb) * 10000) / 100
    : 0;

  return {
    recebimentos_dinheiro_pix: receb,
    total_recebimentos,
    total_pagamentos,
    folha_total,
    lucratividade_pct,
    folha_sobre_receita_pct,
  };
}

Deno.serve(async (req) => {
  const cors = handleCorsOptions(req);
  if (cors) return cors;
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

    const SB_URL = Deno.env.get("SUPABASE_URL")!;
    const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(SB_URL, SB_KEY);

    const { data: sources, error: srcErr } = await sb
      .from("financial_sheet_sources")
      .select("year,month,csv_url")
      .eq("year", year);
    if (srcErr) throw srcErr;

    const result: CashflowResponse = { months: {}, year, errors: {} };

    await Promise.all(
      (sources ?? []).map(async (src: any) => {
        const ms = `${src.year}-${String(src.month).padStart(2, "0")}`;
        try {
          const res = await fetch(src.csv_url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const csv = await res.text();
          const parsed = parseSheet(csv);
          result.months[ms] = parsed;
          // best-effort timestamp update
          await sb
            .from("financial_sheet_sources")
            .update({ last_synced_at: new Date().toISOString() })
            .eq("year", src.year)
            .eq("month", src.month);
        } catch (e) {
          console.error(`cashflow ${ms} failed`, e);
          result.errors[ms] = (e as Error).message;
        }
      })
    );

    // Overlay closed-month snapshots
    const skipSnapshots = req.headers.get("x-skip-snapshots") === "1" ||
      url.searchParams.get("skip_snapshots") === "1";
    if (!skipSnapshots) {
      try {
        const { data: snaps } = await sb
          .from("month_snapshots")
          .select("year,month,payload")
          .eq("source", "financial_cashflow")
          .eq("year", year);
        if (snaps?.length) {
          for (const s of snaps) {
            const ms = `${s.year}-${String(s.month).padStart(2, "0")}`;
            const sp: any = s.payload || {};
            if (sp.months !== undefined) result.months[ms] = sp.months;
          }
        }
      } catch (e) {
        console.error("cashflow snapshot overlay failed:", e);
      }
    }

    return new Response(JSON.stringify(result), { headers, status: 200 });
  } catch (err) {
    console.error("sync-financial-cashflow error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { headers, status: 500 });
  }
});
