import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface FinancialData {
  receita_emp: number;
  receita_emp_assessoria: number;
  receita_emp_consultoria: number;
  receita_tra: number;
  receita_tra_assessoria: number;
  receita_tra_consultoria: number;
  receita_tri: number;
  receita_tri_assessoria: number;
  receita_tri_consultoria: number;
}

export interface FinancialResponse {
  months: Record<string, FinancialData>;
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

function parseFinancialSheet(csv: string): FinancialData {
  const lines = csv.split("\n");
  const data: FinancialData = {
    receita_emp: 0,
    receita_emp_assessoria: 0,
    receita_emp_consultoria: 0,
    receita_tra: 0,
    receita_tra_assessoria: 0,
    receita_tra_consultoria: 0,
    receita_tri: 0,
    receita_tri_assessoria: 0,
    receita_tri_consultoria: 0,
  };

  if (lines.length < 2) return data;

  const header = parseCSVLine(lines[0]);
  const colIdx = {
    contrato: header.findIndex(h => h.toUpperCase().trim() === "CONTRATO"),
    emp: header.findIndex(h => h.toUpperCase().trim() === "CART-EMP"),
    tra: header.findIndex(h => h.toUpperCase().trim() === "CART-TRA"),
    tri: header.findIndex(h => h.toUpperCase().trim() === "CART-TRI"),
  };

  // If columns not found, try common variants
  if (colIdx.emp === -1) colIdx.emp = header.findIndex(h => h.toUpperCase().includes("CART-EMP"));
  if (colIdx.tra === -1) colIdx.tra = header.findIndex(h => h.toUpperCase().includes("CART-TRA"));
  if (colIdx.tri === -1) colIdx.tri = header.findIndex(h => h.toUpperCase().includes("CART-TRI"));

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < Math.max(colIdx.contrato, colIdx.emp, colIdx.tra, colIdx.tri)) continue;

    const contrato = (cols[colIdx.contrato] || "").trim().toLowerCase();
    const valEmp = parseBRNumber(cols[colIdx.emp]);
    const valTra = parseBRNumber(cols[colIdx.tra]);
    const valTri = parseBRNumber(cols[colIdx.tri]);

    // Totals
    data.receita_emp += valEmp;
    data.receita_tra += valTra;
    data.receita_tri += valTri;

    // Assessoria
    if (contrato === "assessoria") {
      data.receita_emp_assessoria += valEmp;
      data.receita_tra_assessoria += valTra;
      data.receita_tri_assessoria += valTri;
    }
    // Consultoria
    else if (contrato.includes("consultoria")) {
      data.receita_emp_consultoria += valEmp;
      data.receita_tra_consultoria += valTra;
      data.receita_tri_consultoria += valTri;
    }
  }

  return data;
}

Deno.serve(async (req) => {
  const cors = handleCorsOptions(req);
  if (cors) return cors;
  const headers = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));
    
    // Spreadsheets specified by the user
    const JULY_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRiilXqIm17FZkDHFpyMKPmL1Wat400EQJ42NlkRYueakkG6eRZ9ToiwRFzMdErSQ/pub?gid=0&output=csv";
    const AUGUST_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRiilXqIm17FZkDHFpyMKPmL1Wat400EQJ42NlkRYueakkG6eRZ9ToiwRFzMdErSQ/pub?gid=2047530861&output=csv";
    
    const result: FinancialResponse = {
      months: {},
      year,
      errors: {}
    };

    const processMonth = async (monthNum: number, fetchUrl: string) => {
      const ms = `2026-${String(monthNum).padStart(2, "0")}`;
      try {
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const csv = await res.text();
        result.months[ms] = parseFinancialSheet(csv);
      } catch (e) {
        result.errors[ms] = (e as Error).message;
      }
    };

    // Apply the specific abas for July and August
    await Promise.all([
      processMonth(7, JULY_URL),
      processMonth(8, AUGUST_URL)
    ]);

    return new Response(JSON.stringify(result), { headers, status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { headers, status: 500 });
  }
});