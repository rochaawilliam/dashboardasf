import { useQuery } from "@tanstack/react-query";

export interface PipelineStageData {
  leads: number;
  reunioes: number;
  propostas: number;
  contratos: number;
  valor_gerado: number;
  prospects: number;
}

export interface PipelineAreaData {
  leads: number;
  reunioes: number;
  propostas: number;
  contratos: number;
  valor_gerado: number;
}

export interface OperationalMetrics {
  avgActionsPerDay: number;
  followUpRate: number;
  advanceRate: number;
  commentsPerLead: number;
  avgFirstContactHours: number;
  slaRate: number;
  avgHandlingDays: number | null;
}

export interface PipelineData {
  months: Record<string, Record<string, PipelineStageData>>;
  totals: Record<string, PipelineStageData>;
  byArea: Record<string, Record<string, Record<string, PipelineAreaData>>>;
  totalsByArea: Record<string, Record<string, PipelineAreaData>>;
  byAreaTag: Record<string, Record<string, Record<string, Record<string, PipelineAreaData>>>>;
  totalsByAreaTag: Record<string, Record<string, Record<string, PipelineAreaData>>>;
  year: number;
  avgCloseDays: number | null;
  avgCloseDaysByMonth: Record<string, number | null>;
  operational: Record<string, OperationalMetrics>;
  operationalTotals: OperationalMetrics;
}

export function usePipelineData(year: number, month?: number | null) {
  return useQuery({
    queryKey: ["pipeline-data", year, month],
    queryFn: async () => {
      const params = new URLSearchParams({ year: String(year) });
      if (month) params.set("month", String(month));

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
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
