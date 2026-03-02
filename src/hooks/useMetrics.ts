import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/error-handler";

export type MetricCategory = 
  | "lucratividade" 
  | "experiencia_cliente" 
  | "produtividade" 
  | "gestao_pessoas" 
  | "aprendizado_crescimento"
  | "execucao_comercial";

export type Division = "juridico" | "crescimento" | "marketing" | "administrativo";

export interface Metric {
  id: string;
  name: string;
  category: MetricCategory;
  division: Division | null;
  target_value: number;
  current_value: number;
  unit: string;
  description: string | null;
  polarity: "higher_is_better" | "lower_is_better";
  created_at: string;
  updated_at: string;
}

export interface MetricHistory {
  id: string;
  metric_id: string;
  value: number;
  recorded_at: string;
  period_type: string;
  created_at: string;
}

export interface TrainingHours {
  id: string;
  role: string;
  target_hours: number;
  current_hours: number;
  division: Division | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyTarget {
  id: string;
  metric_id: string;
  year: number;
  month: number;
  target_value: number;
  created_at: string;
  updated_at: string;
}

export interface Filters {
  period: "month" | "quarter" | "year";
  division: Division | "all";
}

export function useMetrics(filters?: Filters) {
  return useQuery({
    queryKey: ["metrics", filters],
    queryFn: async () => {
      let query = supabase.from("metrics").select("*");
      
      if (filters?.division && filters.division !== "all") {
        query = query.or(`division.eq.${filters.division},division.is.null`);
      }
      
      const { data, error } = await query.order("category");
      
      if (error) throw error;
      return data as Metric[];
    },
  });
}

export function useMetricHistory(metricId?: string, filters?: Filters) {
  return useQuery({
    queryKey: ["metric_history", metricId, filters],
    queryFn: async () => {
      let query = supabase
        .from("metric_history")
        .select("*, metrics(name, unit)")
        .order("recorded_at", { ascending: true });
      
      if (metricId) {
        query = query.eq("metric_id", metricId);
      }
      
      if (filters?.period) {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.period) {
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            break;
          case "quarter":
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
          case "year":
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
            break;
        }
        
        query = query.gte("recorded_at", startDate.toISOString().split("T")[0]);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
}

export function useMonthlyTargets(year?: number) {
  return useQuery({
    queryKey: ["monthly_targets", year],
    queryFn: async () => {
      let query = supabase.from("monthly_targets").select("*");
      
      if (year) {
        query = query.eq("year", year);
      }
      
      const { data, error } = await query.limit(2000);
      
      if (error) throw error;
      return data as MonthlyTarget[];
    },
  });
}

export function useTrainingHours(filters?: Filters) {
  return useQuery({
    queryKey: ["training_hours", filters],
    queryFn: async () => {
      let query = supabase.from("training_hours").select("*");
      
      if (filters?.division && filters.division !== "all") {
        query = query.or(`division.eq.${filters.division},division.is.null`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as TrainingHours[];
    },
  });
}

export function useUpdateMetric() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, current_value, target_value, polarity }: { id: string; current_value?: number; target_value?: number; polarity?: "higher_is_better" | "lower_is_better" }) => {
      const updateData: { current_value?: number; target_value?: number; polarity?: string } = {};
      if (current_value !== undefined) updateData.current_value = current_value;
      if (target_value !== undefined) updateData.target_value = target_value;
      if (polarity !== undefined) updateData.polarity = polarity;
      
      const { data, error } = await supabase
        .from("metrics")
        .update(updateData)
        .eq("id", id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Sem permissão para atualizar esta métrica.");
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      queryClient.invalidateQueries({ queryKey: ["monthly_targets"] });
      toast({
        title: "Meta atualizada",
        description: "Os valores foram salvos com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: sanitizeError(error),
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTrainingHours() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, current_hours, target_hours }: { id: string; current_hours: number; target_hours: number }) => {
      const { data, error } = await supabase
        .from("training_hours")
        .update({ current_hours, target_hours })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training_hours"] });
      toast({
        title: "Horas atualizadas",
        description: "Os valores foram salvos com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: sanitizeError(error),
        variant: "destructive",
      });
    },
  });
}
