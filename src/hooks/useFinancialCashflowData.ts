import { useQuery } from "@tanstack/react-query";

export interface CashflowMonthData {
  recebimentos_dinheiro_pix: number;
  total_recebimentos: number;
  total_pagamentos: number;
  folha_total: number;
  lucratividade_pct: number;
  folha_sobre_receita_pct: number;
  boleto_total: number;
}


export interface CashflowData {
  months: Record<string, CashflowMonthData>;
  year: number;
  errors: Record<string, string>;
}

const CACHE_KEY = "financial-cashflow-cache";
const CACHE_TTL = 10 * 60 * 1000;

function getCached(year: number): CashflowData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp, cacheYear } = JSON.parse(raw);
    if (cacheYear !== year) return null;
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data as CashflowData;
  } catch {
    return null;
  }
}

function setCache(year: number, data: CashflowData) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now(), cacheYear: year })
    );
  } catch {}
}

export function useFinancialCashflowData(year: number) {
  return useQuery({
    queryKey: ["financial-cashflow", year],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/sync-financial-cashflow?year=${year}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) throw new Error(`Financial cashflow fetch failed: ${res.status}`);
      const data = (await res.json()) as CashflowData;
      setCache(year, data);
      return data;
    },
    placeholderData: () => getCached(year) ?? undefined,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    retry: 2,
  });
}
