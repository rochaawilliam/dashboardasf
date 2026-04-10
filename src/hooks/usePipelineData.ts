import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PipelineStageData {
  leads: number;
  reunioes: number;
  propostas: number;
  contratos: number;
  valor_gerado: number;
}

export interface PipelineData {
  months: Record<string, Record<string, PipelineStageData>>;
  totals: Record<string, PipelineStageData>;
  year: number;
}

export function usePipelineData(year: number, month?: number | null) {
  return useQuery({
    queryKey: ["pipeline-data", year, month],
    queryFn: async () => {
      const params = new URLSearchParams({ year: String(year) });
      if (month) params.set("month", String(month));

      const { data, error } = await supabase.functions.invoke("sync-pipeline-data", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: undefined,
      });

      // supabase.functions.invoke doesn't support query params directly,
      // so we'll use fetch instead
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/sync-pipeline-data?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Pipeline fetch failed: ${response.status}`);
      }

      return (await response.json()) as PipelineData;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 2,
  });
}
