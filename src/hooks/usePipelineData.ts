import { useQuery } from "@tanstack/react-query";

export interface PipelineStageData {
  leads: number;
  reunioes: number;
  propostas: number;
  contratos: number;
  valor_gerado: number;
  prospects: number;
  new_leads: number;
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

export interface OnboardingMetrics {
  avgOnboardingDays: number | null;
  complianceRate: number | null;
  avgProgress?: number | null;
  reschedulingRate: number;
  activeClients: number;
  completedClients: number;
  overallCompletion: number;
  byMonth?: Record<string, {
    avgOnboardingDays: number | null;
    complianceRate: number | null;
    avgProgress?: number | null;
    totalClients: number;
    completedClients: number;
    isPartial: boolean;
  }>;
}

export interface TrainingCollaborator {
  name: string;
  hours: number;
  modules: number;
  certified: number;
  nivel?: string;
  hoursTarget?: number;
}

export interface TrainingTheme {
  name: string;
  hours: number;
  modules: number;
}

export interface TrainingTargets {
  headcount: number;
  hours: number;
  modules: number;
  certificationRate: number;
  avgTenureMonths: number;
}

export interface TrainingMetrics {
  headcount: number;
  trainedHeadcount: number;
  avgMonths: number;
  byMonth: Record<string, { hours: number; modules: number; certified: number }>;
  totalHours: number;
  totalModules: number;
  totalCertified: number;
  certificationRate: number;
  topCollaborators: TrainingCollaborator[];
  allCollaborators?: { name: string; fullName: string; nivel: string; hoursTarget: number; hours: number; modules: number }[];
  themes: TrainingTheme[];
  byCollaboratorMonth: Record<string, Record<string, number>>;
  targets?: TrainingTargets;
}

export interface DashboardMonthData {
  leads: number;
  reunioes: number;
  propostas: number;
  r2: number;
  contratos: number;
  prospects: number;
  valor_gerado: number;
  conversao: number;
  avgCloseTimeDays: number | null;
  tmeMinutes: number | null;
  tmaDays: number | null;
  tarefasRealizadas: number;
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
  onboarding?: OnboardingMetrics;
  training?: TrainingMetrics;
  cardNames?: Record<string, Record<string, Record<string, string[]>>>;
  cardNamesByArea?: Record<string, Record<string, Record<string, Record<string, string[]>>>>;
  cardNamesByAreaTag?: Record<string, Record<string, Record<string, Record<string, Record<string, string[]>>>>>;
  dashboard?: Record<string, DashboardMonthData>;
  dashboardTotals?: DashboardMonthData;
  dashboardByOrigin?: Record<string, Record<string, { leads: number; prospects: number; contratos: number; valor_gerado?: number }>>;
  dashboardTotalsByOrigin?: Record<string, { leads: number; prospects: number; contratos: number; valor_gerado?: number }>;
  dashboardByOriginArea?: Record<string, Record<string, Record<string, { leads: number; contratos: number; valor_gerado?: number }>>>;
  dashboardTotalsByOriginArea?: Record<string, Record<string, { leads: number; contratos: number; valor_gerado?: number }>>;
  novosByOriginArea?: Record<string, Record<string, { empresarial: number; trabalhista: number; tributario: number; ambiental?: number; total: number }>>;
  novosTotalsByOriginArea?: Record<string, { empresarial: number; trabalhista: number; tributario: number; ambiental?: number; total: number }>;
  qualificacaoByOrigin?: Record<string, Record<string, { mql: number; sql: number }>>;
  qualificacaoTotalsByOrigin?: Record<string, { mql: number; sql: number }>;
}

const CACHE_KEY = "pipeline-data-cache-v5";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCachedPipeline(year: number, month?: number | null, allowExpired = false): PipelineData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp, cacheYear, cacheMonth } = JSON.parse(raw);
    if (cacheYear !== year || cacheMonth !== (month ?? null)) return null;
    if (!allowExpired && Date.now() - timestamp > CACHE_TTL) return null;
    return data as PipelineData;
  } catch {
    return null;
  }
}

function setCachedPipeline(year: number, month: number | null | undefined, data: PipelineData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
      cacheYear: year,
      cacheMonth: month ?? null,
    }));
  } catch {
    // localStorage full — ignore
  }
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

      if (response.status === 503) {
        const info = await response.json().catch(() => null);
        if (info?.error === "pipeline_access_denied") {
          console.warn("[Pipeline] Acesso temporariamente indisponível:", info.blockedTables);
          // Em indisponibilidade externa, cache expirado ainda é melhor que
          // zerar os cards ou interromper a renderização do dashboard.
          const cached = getCachedPipeline(year, month, true);
          if (cached) return cached;
          return null;
        }
      }

      if (!response.ok) {
        throw new Error(`Pipeline fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as PipelineData;
      setCachedPipeline(year, month, data);
      return data;

    },
    placeholderData: () => getCachedPipeline(year, month) ?? undefined,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000, // auto-refresh every 10 minutes
    refetchOnWindowFocus: "always",   // refresh on tab/page focus
    refetchOnMount: "always",         // refresh on page load
    retry: 1,
  });
}
