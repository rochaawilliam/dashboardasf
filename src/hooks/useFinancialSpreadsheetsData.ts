import { useQuery } from "@tanstack/react-query";

export interface FinancialSpreadsheetData {
  receita_emp: number;
  receita_emp_assessoria: number;
  receita_emp_consultoria: number;
  receita_emp_contencioso?: number;
  receita_tra: number;
  receita_tra_assessoria: number;
  receita_tra_consultoria: number;
  receita_tra_contencioso?: number;
  receita_tri: number;
  receita_tri_assessoria: number;
  receita_tri_consultoria: number;
  receita_tri_contencioso?: number;
  receita_outras?: number;
  clientes_assessoria?: number;
  total_recebimentos?: number;
  total_pagamentos?: number;
  lucratividade_pct?: number;
}



export interface FinancialSpreadsheetsResponse {
  months: Record<string, FinancialSpreadsheetData>;
  year: number;
  errors: Record<string, string>;
}

export function useFinancialSpreadsheetsData(year: number) {
  return useQuery({
    queryKey: ["financial-spreadsheets", year],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/sync-financial-spreadsheets?year=${year}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) throw new Error(`Financial spreadsheets fetch failed: ${res.status}`);
      return (await res.json()) as FinancialSpreadsheetsResponse;
    },
    staleTime: 10 * 60 * 1000,
  });
}