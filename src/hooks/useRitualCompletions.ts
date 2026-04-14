import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface RitualDefinition {
  key: string;
  name: string;
  frequency: "semanal" | "quinzenal" | "mensal" | "trimestral";
  occurrencesPerMonth: number;
  /** For trimestral: only active in these months */
  activeMonths?: number[];
}

export interface RitualCompletion {
  id: string;
  metric_id: string;
  ritual_key: string;
  year: number;
  month: number;
  occurrence: number;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
}

// Ritual metric IDs
export const CUMPRIMENTO_RITUAIS_ID = "a1b2c3d4-2001-4000-a001-000000000001";
export const RITUAIS_ASF_ID = "a1b2c3d4-2001-4000-a001-000000000002";
export const RITUAIS_CRESCIMENTO_ID = "a1b2c3d4-2001-4000-a001-000000000003";
export const RITUAIS_JURIDICO_ID = "a1b2c3d4-2001-4000-a001-000000000004";

export const ALL_RITUAL_IDS = [CUMPRIMENTO_RITUAIS_ID, RITUAIS_ASF_ID, RITUAIS_CRESCIMENTO_ID, RITUAIS_JURIDICO_ID];

const TRIMESTRAL_MONTHS = [3, 6, 9, 12];

export const RITUAL_DEFINITIONS: Record<string, RitualDefinition[]> = {
  [RITUAIS_JURIDICO_ID]: [
    { key: "reuniao_tecnica", name: "Reunião Técnica Semanal", frequency: "semanal", occurrencesPerMonth: 4 },
    { key: "kickoff_juridico", name: "Kickoff Semanal", frequency: "semanal", occurrencesPerMonth: 4 },
    { key: "minicursos", name: "Minicursos Jurídicos (Trilhas ASF)", frequency: "quinzenal", occurrencesPerMonth: 2 },
    { key: "performance_carteiras", name: "Performance das Carteiras", frequency: "mensal", occurrencesPerMonth: 1 },
  ],
  [RITUAIS_CRESCIMENTO_ID]: [
    { key: "reuniao_comercial", name: "Reunião Comercial Semanal", frequency: "semanal", occurrencesPerMonth: 4 },
    { key: "kickoff", name: "Kickoff Semanal", frequency: "semanal", occurrencesPerMonth: 4 },
    { key: "alinhamento_associados", name: "Alinhamento Associados Semanal", frequency: "semanal", occurrencesPerMonth: 4 },
  ],
  [RITUAIS_ASF_ID]: [
    { key: "oneone", name: "Reuniões 1:1", frequency: "mensal", occurrencesPerMonth: 1 },
    { key: "cultura_asf", name: "Reuniões de Cultura ASF", frequency: "quinzenal", occurrencesPerMonth: 2 },
    { key: "cultura_grupo", name: "Reuniões de Cultura Grupo", frequency: "trimestral", occurrencesPerMonth: 1, activeMonths: TRIMESTRAL_MONTHS },
    { key: "fechamento", name: "Fechamento Mensal", frequency: "mensal", occurrencesPerMonth: 1 },
    { key: "pdi", name: "PDI", frequency: "trimestral", occurrencesPerMonth: 1, activeMonths: TRIMESTRAL_MONTHS },
  ],
};

function getFrequencyLabel(freq: string): string {
  switch (freq) {
    case "semanal": return "Semanal";
    case "quinzenal": return "Quinzenal";
    case "mensal": return "Mensal";
    case "trimestral": return "Trimestral";
    default: return freq;
  }
}

function getOccurrenceLabel(freq: string, occ: number): string {
  switch (freq) {
    case "semanal": return `Semana ${occ}`;
    case "quinzenal": return `Quinzena ${occ}`;
    case "mensal": return "Mês";
    case "trimestral": return "Trimestre";
    default: return `#${occ}`;
  }
}

export function getActiveRituals(metricId: string, month: number): RitualDefinition[] {
  const defs = RITUAL_DEFINITIONS[metricId] || [];
  return defs.filter(d => !d.activeMonths || d.activeMonths.includes(month));
}

export function getTotalExpected(metricId: string, month: number): number {
  return getActiveRituals(metricId, month).reduce((sum, r) => sum + r.occurrencesPerMonth, 0);
}

export { getFrequencyLabel, getOccurrenceLabel };

export function useRitualCompletions(metricId: string, year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: ["ritual_completions", metricId, year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ritual_completions")
        .select("*")
        .eq("metric_id", metricId)
        .eq("year", year)
        .eq("month", month);
      if (error) throw error;
      return data as RitualCompletion[];
    },
    enabled,
  });
}

export function useAllRitualCompletions(year: number, enabled = true) {
  return useQuery({
    queryKey: ["ritual_completions_all", year],
    queryFn: async () => {
      const metricIds = [RITUAIS_ASF_ID, RITUAIS_CRESCIMENTO_ID, RITUAIS_JURIDICO_ID];
      const { data, error } = await supabase
        .from("ritual_completions")
        .select("*")
        .in("metric_id", metricIds)
        .eq("year", year);
      if (error) throw error;
      return data as RitualCompletion[];
    },
    enabled,
  });
}

export function useToggleRitualCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      metricId: string;
      ritualKey: string;
      year: number;
      month: number;
      occurrence: number;
      completed: boolean;
      existingId?: string;
    }) => {
      if (params.existingId) {
        const { error } = await supabase
          .from("ritual_completions")
          .update({
            completed: params.completed,
            completed_at: params.completed ? new Date().toISOString() : null,
          })
          .eq("id", params.existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ritual_completions")
          .insert({
            metric_id: params.metricId,
            ritual_key: params.ritualKey,
            year: params.year,
            month: params.month,
            occurrence: params.occurrence,
            completed: params.completed,
            completed_at: params.completed ? new Date().toISOString() : null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ritual_completions"] });
      queryClient.invalidateQueries({ queryKey: ["ritual_completions_all"] });
    },
    onError: (err) => {
      toast({ title: "Erro ao salvar", description: String(err), variant: "destructive" });
    },
  });
}
