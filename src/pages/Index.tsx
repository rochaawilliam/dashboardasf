import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { parseLocalDate, getRefMonthYear } from "@/utils/dateUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/error-handler";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCardMonthly } from "@/components/dashboard/MetricCardMonthly";
import { CircularProgressCard } from "@/components/dashboard/CircularProgressCard";
import { MetricDrilldownDialog } from "@/components/dashboard/MetricDrilldownDialog";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { SubcategoryHeader } from "@/components/dashboard/SubcategoryHeader";
import { TrainingCardEditable } from "@/components/dashboard/TrainingCardEditable";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { DataEntrySection } from "@/components/dashboard/DataEntrySection";
import { MetricChart } from "@/components/dashboard/MetricChart";
import { PrintStyles } from "@/components/dashboard/PrintStyles";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { MobileDrawer } from "@/components/dashboard/MobileDrawer";
import { SwipeableTabs } from "@/components/dashboard/SwipeableTabs";

import { CommissionTab, TridentIcon } from "@/components/dashboard/CommissionTab";
import { SDRCommissionTab } from "@/components/dashboard/SDRCommissionTab";
import { useOfflineCache, usePendingMutations, useOnlineStatus } from "@/hooks/useOfflineMode";
import { SyncStatusFooter } from "@/components/dashboard/SyncStatusFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { organizeMetricsBySubcategory } from "@/utils/metricOrganizer";
import { useSubcategories, useSubcategoryAssignments, useUpdateAssignment } from "@/hooks/useSubcategories";
import { SubcategoryManagerDialog } from "@/components/dashboard/SubcategoryManagerDialog";
import { DraggableCardWrapper } from "@/components/dashboard/DraggableCardWrapper";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Users,
  Zap,
  Rocket,
  Lock,
  LogIn,
  Target,
  TrendingUp,
  Settings2,
  Move,
  Eye,
  EyeOff,
  Globe,
  Building2 } from
"lucide-react";
import { SalesFunnel } from "@/components/dashboard/SalesFunnel";
import { usePipelineData } from "@/hooks/usePipelineData";
import {
  useMetrics,
  useMetricHistory,
  useTrainingHours,
  useMonthlyTargets,
  type Filters,
  type MetricCategory } from
"@/hooks/useMetrics";
import { useMetricNotifications } from "@/hooks/useMetricNotifications";
import { useUserTabPermissions } from "@/hooks/useTabPermissions";
import { useAuth } from "@/hooks/useAuth";

const categoryConfig: Record<string, {title: string;shortTitle: string;subtitle: string;icon: any;variant: "primary" | "accent" | "success" | "warning";}> = {
  lucratividade: {
    title: "Financeiro",
    shortTitle: "Financeiro",
    subtitle: "Aumentar lucratividade e margem do negócio",
    icon: DollarSign,
    variant: "primary"
  },
  experiencia_cliente: {
    title: "Crescimento",
    shortTitle: "Crescimento",
    subtitle: "Acompanhar crescimento comercial e gestão de carteira",
    icon: Rocket,
    variant: "accent"
  },
  produtividade: {
    title: "Jurídico",
    shortTitle: "Jurídico",
    subtitle: "Garantir eficiência do time jurídico",
    icon: Zap,
    variant: "warning"
  },
  gestao_pessoas: {
    title: "Time ASF",
    shortTitle: "Time ASF",
    subtitle: "Construir um time estável, produtivo e engajado",
    icon: Users,
    variant: "success"
  },
};

const categoryOrder: MetricCategory[] = [
"experiencia_cliente",
"produtividade",
"gestao_pessoas",
"lucratividade"];


const COMMISSION_USER_EMAIL = "william.rocha@asfnegocios.com.br";
const SDR_ALLOWED_EMAILS = ["william.rocha@asfnegocios.com.br", "jaderjunior@asfnegocios.com.br"];

// Collapsible subcategory wrapper
function CollapsibleSubcategory({ name, count, collapsible, defaultCollapsed, children

}: {name: string;count: number;collapsible: boolean;defaultCollapsed: boolean;children: React.ReactNode;}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className="mb-3 sm:mb-4">
      <SubcategoryHeader
        name={name}
        count={count}
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        onToggle={setCollapsed} />

      {!collapsed && children}
    </div>);

}

const Index = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { allowedTabs, hasTabAccess, isAdmin, isAuthenticated } = useUserTabPermissions();

  const [filters, setFilters] = useState<Filters>({
    period: "quarter",
    division: "all"
  });
  const [savingMetricId, setSavingMetricId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MetricCategory | "comissao" | "comissao_sdr">("experiencia_cliente");
  const [showFinancialValues, setShowFinancialValues] = useState(false);
  const isCommissionUser = user?.email === COMMISSION_USER_EMAIL;
  const isSDRUser = SDR_ALLOWED_EMAILS.includes(user?.email ?? "");
  const [drilldownMetric, setDrilldownMetric] = useState<typeof adjustedMetrics[number] | null>(null);

  // Month/Year selection state
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: metrics, isLoading: metricsLoading } = useMetrics(filters);
  const { data: historyData, isLoading: historyLoading } = useMetricHistory(undefined, filters);
  const { data: trainingHours, isLoading: trainingLoading } = useTrainingHours(filters);
  const { data: monthlyTargets } = useMonthlyTargets(selectedYear);

  // Pipeline Vision Board data
  const { data: pipelineData } = usePipelineData(selectedYear, selectedMonth);

  // DB-based subcategories
  const { data: dbSubcategories } = useSubcategories();
  const { data: dbAssignments } = useSubcategoryAssignments();
  const updateAssignment = useUpdateAssignment();

  // Admin UI state
  const [showSubcatManager, setShowSubcatManager] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Offline mode hooks
  const isOnline = useOnlineStatus();
  const { cacheMetrics, cacheHistory, getCachedMetrics, getCachedHistory } = useOfflineCache();
  const { pendingCount, addPendingMutation, clearPendingMutations, getPendingMutations } = usePendingMutations();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Cache data when it loads
  useEffect(() => {
    if (metrics) cacheMetrics(metrics);
  }, [metrics, cacheMetrics]);

  useEffect(() => {
    if (historyData) cacheHistory(historyData);
  }, [historyData, cacheHistory]);

  // Enable push notifications for metric goal changes
  useMetricNotifications(metrics, historyData, selectedYear);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Get history record ID for a specific metric/month/year
  const getHistoryId = useCallback((metricId: string) => {
    if (!historyData || selectedMonth === null) return null;
    const record = historyData.find((h) => {
      const ref = getRefMonthYear(h.period_type, h.recorded_at);
      return h.metric_id === metricId &&
      ref.year === selectedYear &&
      ref.month === selectedMonth;
    });
    return record?.id ?? null;
  }, [historyData, selectedMonth, selectedYear]);

  // Save/update monthly value mutation
  const saveMonthlyValue = useMutation({
    mutationFn: async ({ metricId, value }: {metricId: string;value: number;}) => {
      if (selectedMonth === null) return;

      const recordedAt = format(new Date(selectedYear, selectedMonth - 1, 1), "yyyy-MM-dd");
      const existingId = getHistoryId(metricId);

      if (existingId) {
        const { error } = await supabase.
        from("metric_history").
        update({ value }).
        eq("id", existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.
        from("metric_history").
        insert({
          metric_id: metricId,
          value,
          recorded_at: recordedAt,
          period_type: "monthly"
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metric_history"] });
      toast({
        title: "Valor salvo",
        description: "O lançamento foi atualizado com sucesso."
      });
      setSavingMetricId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: sanitizeError(error),
        variant: "destructive"
      });
      setSavingMetricId(null);
    }
  });

  const handleSaveMonthlyValue = useCallback((metricId: string, value: number) => {
    setSavingMetricId(metricId);
    saveMonthlyValue.mutate({ metricId, value });
  }, [saveMonthlyValue]);

  // Get monthly values for selected month/year
  const monthlyValues = useMemo(() => {
    if (!historyData || selectedMonth === null) return {};

    const values: Record<string, number> = {};
    historyData.forEach((h) => {
      if ((h as any).source === 'forecast') return; // Exclude forecast entries
      const ref = getRefMonthYear(h.period_type, h.recorded_at);
      if (ref.year === selectedYear && ref.month === selectedMonth) {
        values[h.metric_id] = (values[h.metric_id] || 0) + h.value;
      }
    });
    return values;
  }, [historyData, selectedMonth, selectedYear]);

  // Calculate accumulated values per metric for "Todo o Período" (selected year)
  const accumulatedValues = useMemo(() => {
    if (!historyData) return {};

    const values: Record<string, number> = {};
    historyData.forEach((h) => {
      if ((h as any).source === 'forecast') return; // Exclude forecast entries
      const ref = getRefMonthYear(h.period_type, h.recorded_at);
      if (ref.year === selectedYear) {
        values[h.metric_id] = (values[h.metric_id] || 0) + h.value;
      }
    });
    return values;
  }, [historyData, selectedYear]);

  // Compute forecast values per metric per month (source='forecast')
  const forecastValues = useMemo(() => {
    if (!historyData || selectedMonth === null) return {};

    const values: Record<string, number> = {};
    historyData.forEach((h) => {
      if ((h as any).source !== 'forecast') return;
      const ref = getRefMonthYear(h.period_type, h.recorded_at);
      if (ref.year === selectedYear && ref.month === selectedMonth) {
        values[h.metric_id] = (values[h.metric_id] || 0) + h.value;
      }
    });
    return values;
  }, [historyData, selectedMonth, selectedYear]);

  // Pipeline data mapping: metric IDs → pipeline stage keys (by origin)
  const PIPELINE_METRIC_MAP: Record<string, { origin: string; key: string }> = {
    "dc434066-4bd6-4c89-a22e-04ba5ea1dd9c": { origin: "online", key: "leads" },
    "a1b2c3d4-4444-4aaa-bbbb-444444444444": { origin: "online", key: "reunioes" },
    "a1b2c3d4-5555-4aaa-bbbb-555555555555": { origin: "online", key: "propostas" },
    "1d927738-a02b-4867-8a7a-a7a2331773ec": { origin: "online", key: "contratos" },
    "a1b2c3d4-6666-4aaa-bbbb-666666666666": { origin: "online", key: "valor_gerado" },
    "b2c3d4e5-2222-4bbb-cccc-222222222222": { origin: "offline", key: "prospects" },
    "b2c3d4e5-3333-4bbb-cccc-333333333333": { origin: "offline", key: "leads" },
    "b2c3d4e5-4444-4bbb-cccc-444444444444": { origin: "offline", key: "reunioes" },
    "b2c3d4e5-5555-4bbb-cccc-555555555555": { origin: "offline", key: "propostas" },
    "7ea4560c-5f42-4982-9b27-b68f2475b838": { origin: "offline", key: "contratos" },
    "b2c3d4e5-6666-4bbb-cccc-666666666666": { origin: "offline", key: "valor_gerado" },
  };

  // Pipeline area mapping: metric IDs → pipeline by origin + practice_area
  const PIPELINE_AREA_MAP: Record<string, { origin: string; area: string; key: string }> = {
    // Leads Online by area
    "c1d2e3f4-1111-4ccc-dddd-111111111111": { origin: "online", area: "empresarial", key: "leads" },
    "c1d2e3f4-2222-4ccc-dddd-222222222222": { origin: "online", area: "trabalhista", key: "leads" },
    "c1d2e3f4-3333-4ccc-dddd-333333333333": { origin: "online", area: "tributario", key: "leads" },
    // Leads Offline by area
    "86714c67-bf73-452a-aad3-2be1691c33ac": { origin: "offline", area: "empresarial", key: "leads" },
    "371dd70d-7c46-4488-b7ad-80ded893af5d": { origin: "offline", area: "trabalhista", key: "leads" },
    "57ca6f08-7bb6-4697-87fe-8ac33161285c": { origin: "offline", area: "tributario", key: "leads" },
    // Reuniões by area (all origins combined)
    "2b59c639-5e5f-4d0d-b0aa-5a3394444389": { origin: "_all", area: "empresarial", key: "reunioes" },
    "717fb24d-f213-4135-ae10-42a4237979bd": { origin: "_all", area: "trabalhista", key: "reunioes" },
    "45277578-48f9-4eda-87f5-28bc66918236": { origin: "_all", area: "tributario", key: "reunioes" },
    // Propostas by area (all origins combined)
    "af0307d2-186e-4bf3-b536-66c451ccf056": { origin: "_all", area: "empresarial", key: "propostas" },
    "a88438f0-dbd0-4230-9b18-d56117936d36": { origin: "_all", area: "trabalhista", key: "propostas" },
    "7f937d5a-6502-4fdd-810d-11fc4413d864": { origin: "_all", area: "tributario", key: "propostas" },
    // Novos Contratos by area (from contratos stage) - Assessoria
    "f80d5c78-cf50-4aca-befb-5808b6557d8e": { origin: "_all", area: "empresarial", key: "contratos" },
    "ae64d582-a08d-442c-998e-b6bc214e486e": { origin: "_all", area: "trabalhista", key: "contratos" },
    "a1102d97-a2a6-44d6-8ac7-716cc1474d16": { origin: "_all", area: "tributario", key: "contratos" },
  };

  // Crescimento Comercial rates from pipeline
  const TAXA_AGENDAMENTO_ID = "a1b2c3d4-1111-4aaa-bbbb-111111111111";
  const TAXA_COMPARECIMENTO_ID = "a1b2c3d4-2222-4aaa-bbbb-222222222222";
  const TAXA_CONVERSAO_ID = "a1b2c3d4-3333-4aaa-bbbb-333333333333";
  const TEMPO_MEDIO_FECHAMENTO_ID = "ab16383b-2125-4bec-b942-ae4466a8d069";

  // ROI metric IDs
  const ROI_ONLINE_ID = "a1b2c3d4-7777-4aaa-bbbb-777777777777";
  const ROI_OFFLINE_ID = "b2c3d4e5-7777-4bbb-cccc-777777777777";
  const VALOR_INVESTIDO_ONLINE_ID = "036e92ce-4bc3-417d-922f-936c1aba7421";
  const VALOR_INVESTIDO_OFFLINE_ID = "b2c3d4e5-1111-4bbb-cccc-111111111111";
  const VALOR_GERADO_ONLINE_ID = "a1b2c3d4-6666-4aaa-bbbb-666666666666";
  const VALOR_GERADO_OFFLINE_ID = "b2c3d4e5-6666-4bbb-cccc-666666666666";

  const pipelineMonthlyValues = useMemo(() => {
    if (!pipelineData) return {};
    const values: Record<string, number> = {};

    // Standard origin-based metrics
    for (const [metricId, mapping] of Object.entries(PIPELINE_METRIC_MAP)) {
      if (selectedMonth) {
        const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
        const val = pipelineData.months?.[monthStr]?.[mapping.origin]?.[mapping.key];
        if (val !== undefined) values[metricId] = val;
      } else {
        const val = pipelineData.totals?.[mapping.origin]?.[mapping.key];
        if (val !== undefined) values[metricId] = val;
      }
    }

    // Area-based metrics
    for (const [metricId, mapping] of Object.entries(PIPELINE_AREA_MAP)) {
      const getAreaVal = (source: Record<string, Record<string, any>> | undefined) => {
        if (!source) return undefined;
        if (mapping.origin === "_all") {
          // Sum across all origins
          let total = 0;
          let found = false;
          for (const originData of Object.values(source)) {
            const val = originData?.[mapping.area]?.[mapping.key];
            if (val !== undefined) { total += val; found = true; }
          }
          return found ? total : undefined;
        }
        return source?.[mapping.origin]?.[mapping.area]?.[mapping.key];
      };

      if (selectedMonth) {
        const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
        const val = getAreaVal(pipelineData.byArea?.[monthStr]);
        if (val !== undefined) values[metricId] = val;
      } else {
        const val = getAreaVal(pipelineData.totalsByArea);
        if (val !== undefined) values[metricId] = val;
      }
    }

    // Compute rates from pipeline totals
    const getTotal = (key: string) => {
      let sum = 0;
      const source = selectedMonth
        ? (() => { const ms = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`; return pipelineData.months?.[ms]; })()
        : pipelineData.totals;
      if (!source) return 0;
      for (const originData of Object.values(source)) {
        sum += (originData as any)?.[key] ?? 0;
      }
      return sum;
    };

    const totalLeads = getTotal("leads");
    const totalReunioes = getTotal("reunioes");
    const totalPropostas = getTotal("propostas");
    const totalContratos = getTotal("contratos");

    // Taxa de Agendamento = Reuniões / Leads * 100
    if (totalLeads > 0) values[TAXA_AGENDAMENTO_ID] = Math.round(totalReunioes / totalLeads * 10000) / 100;
    // Taxa de Comparecimento = Propostas / Reuniões * 100
    if (totalReunioes > 0) values[TAXA_COMPARECIMENTO_ID] = Math.round(totalPropostas / totalReunioes * 10000) / 100;
    // Taxa de Conversão = Contratos / Leads * 100
    if (totalLeads > 0) values[TAXA_CONVERSAO_ID] = Math.round(totalContratos / totalLeads * 10000) / 100;

    // Tempo Médio de Fechamento from pipeline
    if (selectedMonth) {
      const ms = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
      const avgDays = pipelineData.avgCloseDaysByMonth?.[ms];
      if (avgDays !== undefined && avgDays !== null) values[TEMPO_MEDIO_FECHAMENTO_ID] = avgDays;
    } else {
      if (pipelineData.avgCloseDays !== null && pipelineData.avgCloseDays !== undefined) {
        values[TEMPO_MEDIO_FECHAMENTO_ID] = pipelineData.avgCloseDays;
      }
    }

    return values;
  }, [pipelineData, selectedMonth, selectedYear]);

  const pipelineAccumulatedValues = useMemo(() => {
    if (!pipelineData) return {};
    const values: Record<string, number> = {};

    for (const [metricId, mapping] of Object.entries(PIPELINE_METRIC_MAP)) {
      const val = pipelineData.totals?.[mapping.origin]?.[mapping.key];
      if (val !== undefined) values[metricId] = val;
    }

    // Area accumulated
    for (const [metricId, mapping] of Object.entries(PIPELINE_AREA_MAP)) {
      if (mapping.origin === "_all") {
        let total = 0;
        let found = false;
        if (pipelineData.totalsByArea) {
          for (const originData of Object.values(pipelineData.totalsByArea)) {
            const val = originData?.[mapping.area]?.[mapping.key];
            if (val !== undefined) { total += val; found = true; }
          }
        }
        if (found) values[metricId] = total;
      } else {
        const val = pipelineData.totalsByArea?.[mapping.origin]?.[mapping.area]?.[mapping.key];
        if (val !== undefined) values[metricId] = val;
      }
    }

    // Rates accumulated
    let totalLeads = 0, totalReunioes = 0, totalPropostas = 0, totalContratos = 0;
    if (pipelineData.totals) {
      for (const originData of Object.values(pipelineData.totals)) {
        totalLeads += originData.leads ?? 0;
        totalReunioes += originData.reunioes ?? 0;
        totalPropostas += originData.propostas ?? 0;
        totalContratos += originData.contratos ?? 0;
      }
    }
    if (totalLeads > 0) values[TAXA_AGENDAMENTO_ID] = Math.round(totalReunioes / totalLeads * 10000) / 100;
    if (totalReunioes > 0) values[TAXA_COMPARECIMENTO_ID] = Math.round(totalPropostas / totalReunioes * 10000) / 100;
    if (totalLeads > 0) values[TAXA_CONVERSAO_ID] = Math.round(totalContratos / totalLeads * 10000) / 100;

    // Tempo Médio accumulated
    if (pipelineData.avgCloseDays !== null && pipelineData.avgCloseDays !== undefined) {
      values[TEMPO_MEDIO_FECHAMENTO_ID] = pipelineData.avgCloseDays;
    }

    return values;
  }, [pipelineData]);

  const mergedMonthlyValues = useMemo(() => {
    const merged = {
      ...monthlyValues,
      ...pipelineMonthlyValues,
    };
    // Auto-calculate ROI = (Valor Gerado / Valor Investido) * 100
    const valorGeradoOnline = merged[VALOR_GERADO_ONLINE_ID] ?? 0;
    const valorInvestidoOnline = merged[VALOR_INVESTIDO_ONLINE_ID] ?? 0;
    if (valorInvestidoOnline > 0) {
      merged[ROI_ONLINE_ID] = Math.round((valorGeradoOnline / valorInvestidoOnline) * 10000) / 100;
    }
    const valorGeradoOffline = merged[VALOR_GERADO_OFFLINE_ID] ?? 0;
    const valorInvestidoOffline = merged[VALOR_INVESTIDO_OFFLINE_ID] ?? 0;
    if (valorInvestidoOffline > 0) {
      merged[ROI_OFFLINE_ID] = Math.round((valorGeradoOffline / valorInvestidoOffline) * 10000) / 100;
    }
    return merged;
  }, [monthlyValues, pipelineMonthlyValues]);

  const mergedAccumulatedValues = useMemo(() => {
    const merged = {
      ...accumulatedValues,
      ...pipelineAccumulatedValues,
    };
    // Auto-calculate ROI accumulated
    const valorGeradoOnline = merged[VALOR_GERADO_ONLINE_ID] ?? 0;
    const valorInvestidoOnline = merged[VALOR_INVESTIDO_ONLINE_ID] ?? 0;
    if (valorInvestidoOnline > 0) {
      merged[ROI_ONLINE_ID] = Math.round((valorGeradoOnline / valorInvestidoOnline) * 10000) / 100;
    }
    const valorGeradoOffline = merged[VALOR_GERADO_OFFLINE_ID] ?? 0;
    const valorInvestidoOffline = merged[VALOR_INVESTIDO_OFFLINE_ID] ?? 0;
    if (valorInvestidoOffline > 0) {
      merged[ROI_OFFLINE_ID] = Math.round((valorGeradoOffline / valorInvestidoOffline) * 10000) / 100;
    }
    return merged;
  }, [accumulatedValues, pipelineAccumulatedValues]);

  // IDs for contract metrics used in the sum
  const CONTRATOS_EMP_ASSESSORIA_ID = "f80d5c78-cf50-4aca-befb-5808b6557d8e";
  const CONTRATOS_EMP_CONSULTORIA_ID = "90726f8c-8cf7-47d8-81b6-c6f22c4eeef5";
  const CONTRATOS_TRAB_ASSESSORIA_ID = "ae64d582-a08d-442c-998e-b6bc214e486e";
  const CONTRATOS_TRAB_CONSULTORIA_ID = "0ffeaffb-ab3c-4371-be5b-172f57160ec4";

  // ID for "Total de Contratos" (computed)
  const TOTAL_CONTRATOS_ID = "d3e4f5a6-b7c8-9012-cdef-234567890abc";

  // IDs for tributário metrics used in Total de Contratos
  const CONTRATOS_TRIB_ASSESSORIA_ID = "a1102d97-a2a6-44d6-8ac7-716cc1474d16";
  const CONTRATOS_TRIB_PONTUAL_ID = "95280373-3e3b-4596-b2c4-ce8e01ee1b2c";

  // IDs for origin tracking cards
  const CONTRATOS_OFFLINE_ID = "7ea4560c-5f42-4982-9b27-b68f2475b838";
  const CONTRATOS_ONLINE_ID = "1d927738-a02b-4867-8a7a-a7a2331773ec";

  // MRR % Mensal - auto-calculated metric
  const MRR_METRIC_ID = "f21b4372-4b70-4bb0-9236-e2cd2695c156";
  const RECEITA_EMP_ASSESSORIA_ID = "b3291022-409f-4679-bddc-bc687f3d9d68";
  const RECEITA_TRAB_ASSESSORIA_ID = "be1fcc4f-c1b8-476a-b330-e2b8675ae458";
  const RECEITA_TRIB_ASSESSORIA_ID = "b829cf12-3f66-4a0c-8753-70260a9645d8";
  const ARR_METRIC_ID = "c80c98f8-964c-4146-9012-eb0d0c5a30ee";

  // Computed revenue cards
  const RESULTADO_ACUMULADO_ID = "8a4ed9b7-7e8b-45ff-a957-3818181a83f6";
  const EFICIENCIA_RECEITA_ID = "3c0e94b6-9128-4e54-b5a8-7ae6862641bc";
  const RECEITA_TOTAL_MENSAL_ID = "b94952b3-b811-4200-872e-810b215240f6";

  // Computed revenue sum cards
  const RECEITA_EMP_ID = "8d4cfa8e-1d37-48d0-8c17-ce896c875be0";
  const RECEITA_EMP_CONSULTORIA_ID = "560bece4-6e53-46be-add1-fa6dfdbdaaf7";
  const RECEITA_EMP_PONTUAL_ID = "de3186d7-1b20-41e2-8fd9-9fef114096bb";
  const RECEITA_TRAB_ID = "5368d04f-a051-450e-9654-7553dc3db981";
  const RECEITA_TRAB_CONSULTORIA_ID = "33d2ab91-2534-4cb0-b21c-6a2d7fc628b1";
  const RECEITA_TRAB_PONTUAL_ID = "f1fd7525-963f-401e-a1e1-7b449f022bbd";
  const RECEITA_TRIB_ID = "6326e88a-ba6d-4fbf-958d-0ae9bc76b889";
  const RECEITA_TRIB_CONSULTORIA_ID = "847ce517-c118-46c9-9012-c69dfa5474d9";
  const RECEITA_TRIB_PONTUAL_ID = "6122d0fc-e606-4020-afab-45658e063158";
  const OUTRAS_RECEITAS_ID = "c0a1fe29-7d31-424c-9f86-6766981dcd82";

  // Revenue sum component IDs grouped
  const RECEITA_EMP_COMPONENTS = [RECEITA_EMP_ASSESSORIA_ID, RECEITA_EMP_CONSULTORIA_ID, RECEITA_EMP_PONTUAL_ID];
  const RECEITA_TRAB_COMPONENTS = [RECEITA_TRAB_ASSESSORIA_ID, RECEITA_TRAB_CONSULTORIA_ID, RECEITA_TRAB_PONTUAL_ID];
  const RECEITA_TRIB_COMPONENTS = [RECEITA_TRIB_ASSESSORIA_ID, RECEITA_TRIB_CONSULTORIA_ID, RECEITA_TRIB_PONTUAL_ID];


  // Compute origin card values from history source field
  const originValues = useMemo(() => {
    if (!historyData) return { online: { monthly: 0, accumulated: 0 }, offline: { monthly: 0, accumulated: 0 } };

    // All "Novos Contratos" metric IDs (excluding the origin cards themselves)
    const novosContratosIds = new Set([
    CONTRATOS_EMP_ASSESSORIA_ID, CONTRATOS_EMP_CONSULTORIA_ID,
    CONTRATOS_TRAB_ASSESSORIA_ID, CONTRATOS_TRAB_CONSULTORIA_ID,
    CONTRATOS_TRIB_ASSESSORIA_ID, CONTRATOS_TRIB_PONTUAL_ID
    ]);

    let onlineMonthly = 0,offlineMonthly = 0,onlineAcc = 0,offlineAcc = 0;
    historyData.forEach((h: any) => {
      if (!novosContratosIds.has(h.metric_id)) return;
      const ref = getRefMonthYear(h.period_type, h.recorded_at);
      if (ref.year !== selectedYear) return;
      if (h.source === "online") {
        onlineAcc += h.value;
        if (selectedMonth !== null && ref.month === selectedMonth) onlineMonthly += h.value;
      } else if (h.source === "offline") {
        offlineAcc += h.value;
        if (selectedMonth !== null && ref.month === selectedMonth) offlineMonthly += h.value;
      }
    });
    return { online: { monthly: onlineMonthly, accumulated: onlineAcc }, offline: { monthly: offlineMonthly, accumulated: offlineAcc } };
  }, [historyData, selectedMonth, selectedYear]);

  // Compute dynamic targets for origin cards (30% online, 70% offline of total new contracts)
  const originTargets = useMemo(() => {
    if (!monthlyTargets) return { online: 0, offline: 0 };
    const novosContratosIds = [
    CONTRATOS_EMP_ASSESSORIA_ID, CONTRATOS_EMP_CONSULTORIA_ID,
    CONTRATOS_TRAB_ASSESSORIA_ID, CONTRATOS_TRAB_CONSULTORIA_ID,
    CONTRATOS_TRIB_ASSESSORIA_ID, CONTRATOS_TRIB_PONTUAL_ID
    ];
    const month = selectedMonth ?? new Date().getMonth() + 1;
    const year = selectedYear;
    const totalMonthlyTarget = novosContratosIds.reduce((sum, id) => {
      const mt = monthlyTargets.find((t) => t.metric_id === id && t.month === month && t.year === year);
      return sum + (mt?.target_value ?? 0);
    }, 0);
    return {
      online: Math.round(totalMonthlyTarget * 0.3 * 100) / 100,
      offline: Math.round(totalMonthlyTarget * 0.7 * 100) / 100
    };
  }, [monthlyTargets, selectedMonth, selectedYear]);

  // Create metrics with adjusted values based on selection
  const adjustedMetrics = useMemo(() => {
    if (!metrics) return [];

    return metrics.map((metric) => {
      let currentValue = selectedMonth === null ?
      accumulatedValues[metric.id] ?? 0 :
      metric.current_value;


      // Compute origin card values and dynamic targets
      if (metric.id === CONTRATOS_ONLINE_ID) {
        currentValue = selectedMonth !== null ? originValues.online.monthly : originValues.online.accumulated;
        return { ...metric, current_value: currentValue, target_value: originTargets.online * 12 };
      } else if (metric.id === CONTRATOS_OFFLINE_ID) {
        currentValue = selectedMonth !== null ? originValues.offline.monthly : originValues.offline.accumulated;
        return { ...metric, current_value: currentValue, target_value: originTargets.offline * 12 };
      }

      return {
        ...metric,
        current_value: currentValue
      };
    });
  }, [metrics, selectedMonth, accumulatedValues, originValues, originTargets]);

  // Group metrics by category
  const groupedMetrics = useMemo(() => {
    return adjustedMetrics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric);
      return acc;
    }, {} as Record<MetricCategory, typeof adjustedMetrics>);
  }, [adjustedMetrics]);

  // Calculate metrics count per category for mobile drawer
  const categoryMetricsCounts = useMemo(() => {
    const counts: Record<MetricCategory, number> = {} as Record<MetricCategory, number>;
    categoryOrder.forEach((cat) => {
      counts[cat] = groupedMetrics[cat]?.length || 0;
    });
    return counts;
  }, [groupedMetrics]);

  // Group history by category for charts (filter by year)
  const historyByCategory = useMemo(() => {
    if (!historyData || !metrics) return {};

    const filtered = historyData.filter((h) => {
      const ref = getRefMonthYear(h.period_type, h.recorded_at);
      return ref.year === selectedYear;
    });

    return filtered.reduce((acc, item) => {
      const metric = metrics.find((m) => m.id === item.metric_id);
      if (metric) {
        if (!acc[metric.category]) {
          acc[metric.category] = [];
        }
        acc[metric.category].push(item);
      }
      return acc;
    }, {} as Record<MetricCategory, typeof historyData>);
  }, [historyData, metrics, selectedYear]);

  // Sync pending mutations when back online
  const handleSync = useCallback(async () => {
    if (!isOnline) return;

    setIsSyncing(true);
    const pending = getPendingMutations();

    for (const mutation of pending) {
      try {
        if (mutation.action === "insert") {
          await supabase.from("metric_history").insert(mutation.data);
        } else if (mutation.action === "update") {
          await supabase.from("metric_history").update(mutation.data).eq("id", mutation.data.id);
        }
      } catch (error) {
        console.error("Sync failed for mutation:", mutation, error);
      }
    }

    clearPendingMutations();
    queryClient.invalidateQueries({ queryKey: ["metric_history"] });
    setLastSyncedAt(new Date());
    toast({
      title: "✅ Sincronização concluída",
      description: `${pending.length} alteração(ões) sincronizada(s).`
    });
    setIsSyncing(false);
  }, [isOnline, getPendingMutations, clearPendingMutations, queryClient]);

  if (metricsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto px-[5vw] py-8">
          <DashboardHeader />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) =>
            <Skeleton key={i} className="h-32 rounded-xl" />
            )}
          </div>
          <div className="dashboard-grid">
            {[...Array(6)].map((_, i) =>
            <Skeleton key={i} className="h-48 rounded-xl" />
            )}
          </div>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background pb-14">
      <PrintStyles />
      
      
      <div className="mx-auto px-2 sm:px-[5vw] py-3 sm:py-4 md:py-[12px]">
        <div data-tour="header">
          <DashboardHeader
            metrics={adjustedMetrics}
            historyData={historyData}
            selectedYear={selectedYear}
            mobileDrawer={
            <div data-tour="mobile-menu">
                <MobileDrawer
                activeTab={activeTab === "comissao" || activeTab === "comissao_sdr" ? "experiencia_cliente" : activeTab}
                onTabChange={(tab) => setActiveTab(tab as MetricCategory)}
                categoryMetricsCounts={categoryMetricsCounts} />

              </div>
            } />

        </div>
        
        {/* Data Entry Section - only for authenticated users */}
        {user && metrics &&
        <div data-tour="data-entry">
            <DataEntrySection
            metrics={metrics}
            trainingHours={trainingHours}
            filters={filters}
            onFiltersChange={setFilters}
            onPrint={handlePrint} />

          </div>
        }
        
        {/* Filters for unauthenticated users */}
        {!user &&
        <div data-tour="filters">
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            onPrint={handlePrint} />
        </div>
        }
        
        {/* Month Selector */}
        <div data-tour="month-selector">
          <MonthSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            historyData={historyData} />

        </div>

        {/* Category Tabs - wrapped with auth overlay for unauthenticated users */}
        {!user ?
        <div className="relative">
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl min-h-[400px]">
              <Lock className="h-10 w-10 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Dados Protegidos</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
                Faça login para visualizar os indicadores do dashboard
              </p>
              <Link to="/login">
                <Button className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Faça seu login
                </Button>
              </Link>
            </div>
            <div className="pointer-events-none select-none blur-md opacity-50 min-h-[400px]">
              <SwipeableTabs<MetricCategory>
              tabs={categoryOrder}
              activeTab={activeTab === "comissao" || activeTab === "comissao_sdr" ? "experiencia_cliente" : activeTab}
              onTabChange={(tab) => setActiveTab(tab as MetricCategory)}>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MetricCategory)} className="mb-4 sm:mb-6">
                  <div className="flex items-end bg-muted/30 rounded-t-xl pt-1 px-1 gap-0.5">
                    {categoryOrder.map((category) => {
                    const config = categoryConfig[category];
                    const Icon = config.icon;
                    const isActive = activeTab === category;
                    return (
                      <button
                        key={category}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-t-lg",
                          "text-[9px] sm:text-xs font-medium",
                          isActive ? "bg-primary text-primary-foreground shadow-sm z-10" : "bg-muted/50 text-muted-foreground"
                        )}>

                          <Icon className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="hidden sm:inline truncate">{config.shortTitle}</span>
                        </button>);

                  })}
                  </div>
                  <TabsContent value={activeTab} className="mt-0 bg-card border border-t-0 border-border/50 rounded-b-xl p-3 sm:p-4">
                    <div className="dashboard-grid">
                      {[...Array(6)].map((_, i) =>
                    <Skeleton key={i} className="h-32 rounded-xl" />
                    )}
                    </div>
                  </TabsContent>
                </Tabs>
              </SwipeableTabs>
            </div>
          </div> :

        <>
            {/* Category Tabs with Swipe Support */}
            <SwipeableTabs<MetricCategory>
            tabs={categoryOrder}
            activeTab={activeTab === "comissao" || activeTab === "comissao_sdr" ? "experiencia_cliente" : activeTab}
            onTabChange={(tab) => setActiveTab(tab as MetricCategory)}>

              <Tabs value={activeTab === "comissao" ? "comissao" : activeTab === "comissao_sdr" ? "comissao_sdr" : activeTab} onValueChange={(v) => setActiveTab(v as MetricCategory | "comissao" | "comissao_sdr")} className="mb-3 sm:mb-4">
                {/* Chrome-style tabs - full width */}
                <div data-tour="category-tabs" className="flex items-stretch bg-muted/30 rounded-t-xl pt-1 gap-0.5 px-0 py-0 overflow-hidden w-full">
                  {/* Secret Commission Tab */}
                  {isCommissionUser &&
                <button
                  onClick={() => setActiveTab("comissao")}
                  className={cn(
                    "flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-2 sm:px-3 rounded-t-lg transition-all relative",
                    "text-[9px] sm:text-xs font-medium",
                    activeTab === "comissao" ?
                    "bg-purple-600 text-white shadow-sm z-10" :
                    "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                  )}
                  title="Head Growth">

                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="hidden sm:inline truncate">Head Growth</span>
                    </button>
                }
                  {/* SDR Commission Tab */}
                  {isSDRUser &&
                <button
                  onClick={() => setActiveTab("comissao_sdr")}
                  className={cn(
                    "flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-2 sm:px-3 rounded-t-lg transition-all relative",
                    "text-[9px] sm:text-xs font-medium",
                    activeTab === "comissao_sdr" ?
                    "bg-green-600 text-white shadow-sm z-10" :
                    "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  )}
                  title="Salário Variável SDR">

                      <Target className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="hidden sm:inline truncate">SDR</span>
                    </button>
                }
                  {categoryOrder.map((category) => {
                  const config = categoryConfig[category];
                  const Icon = config.icon;
                  const categoryMetricsCount = groupedMetrics[category]?.length || 0;
                  const isActive = activeTab === category;
                  const canAccess = hasTabAccess(category);

                  return (
                    <button
                      key={category}
                      onClick={() => canAccess && setActiveTab(category)}
                      disabled={!canAccess}
                      className={cn(
                        "flex-1 min-w-0 flex items-center justify-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 px-0.5 sm:px-1.5 rounded-t-lg transition-all relative",
                        "text-[8px] sm:text-[10px] font-medium",
                        !canAccess && "opacity-50 cursor-not-allowed",
                        isActive && canAccess ?
                        "bg-primary text-primary-foreground shadow-sm z-10" :
                        canAccess ?
                        "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground" :
                        "bg-muted/30 text-muted-foreground"
                      )}
                      title={!canAccess ? "Acesso restrito - Entre em contato com o administrador" : config.title}>

                        {!canAccess ?
                      <Lock className="h-3 w-3 shrink-0" /> :
                      <Icon className="h-3 w-3 shrink-0" />
                      }
                    <span className="hidden md:inline truncate text-[10px] lg:text-xs">{config.shortTitle}</span>
                        <span className={cn(
                        "hidden md:inline text-[7px] px-1 py-0.5 rounded-full font-semibold",
                        isActive && canAccess ?
                        "bg-primary-foreground/20 text-primary-foreground" :
                        "bg-muted text-muted-foreground"
                      )}>
                          {canAccess ? categoryMetricsCount : "🔒"}
                        </span>
                      </button>);

                })}
                </div>

                {categoryOrder.map((category) => {
                const config = categoryConfig[category];
                const categoryMetrics = groupedMetrics[category] || [];
                const canAccess = hasTabAccess(category);

                const categoryHistory = historyByCategory?.[category];
                const organizedSubcategories = organizeMetricsBySubcategory(categoryMetrics, category, dbSubcategories, dbAssignments);

                return (
                  <TabsContent key={category} value={category} className="mt-0 bg-card border border-t-0 border-border/50 rounded-b-xl p-2 sm:p-3 lg:p-4 animate-fade-in">
                      {!canAccess ?
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                          <Lock className="h-16 w-16 text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                            Acesso Restrito
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-md mb-4">
                            Você não tem permissão para visualizar esta aba. Entre em contato com o administrador para solicitar acesso.
                          </p>
                        </div> :

                    <>
                          <div className="flex items-center justify-between">
                            <SectionHeader
                          title={config.title}
                          subtitle={config.subtitle}
                          icon={config.icon}
                          variant={config.variant} />
                            <div className="flex items-center gap-1.5 mb-2">
                              {category === "lucratividade" &&
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 sm:h-7 text-xs gap-1 px-2.5 sm:px-3"
                                  onClick={() => setShowFinancialValues(!showFinancialValues)}
                                  title={showFinancialValues ? "Ocultar valores" : "Mostrar valores"}>
                                  {showFinancialValues ? <Eye className="h-3.5 w-3.5 sm:h-3 sm:w-3" /> : <EyeOff className="h-3.5 w-3.5 sm:h-3 sm:w-3" />}
                                  <span className="hidden sm:inline">{showFinancialValues ? "Ocultar" : "Mostrar"}</span>
                                </Button>
                              }
                              {isAdmin &&
                            <>
                                <Button
                            variant={isDragMode ? "default" : "outline"}
                            size="sm"
                            className="h-8 sm:h-7 text-xs gap-1 px-2.5 sm:px-3"
                            onClick={() => setIsDragMode(!isDragMode)}
                            title={isDragMode ? "Concluir organização" : "Organizar cards"}>
                            
                                  <Move className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                                  <span className="hidden sm:inline">{isDragMode ? "Concluir" : "Organizar"}</span>
                                </Button>
                                <Button
                            variant="outline"
                            size="sm"
                            className="h-8 sm:h-7 text-xs gap-1 px-2.5 sm:px-3"
                            onClick={() => setShowSubcatManager(true)}
                            title="Gerenciar subcategorias">
                            
                                  <Settings2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                                  <span className="hidden sm:inline">Subcategorias</span>
                                </Button>
                              </>
                        }
                            </div>
                          </div>

                      
                          {/* Render Funnel subcategories with special layout */}
                          {(() => {
                            const funnelOnline = organizedSubcategories.find(s => s.name === "Funil Online");
                            const funnelOffline = organizedSubcategories.find(s => s.name === "Funil Offline");
                            if (category === "experiencia_cliente" && (funnelOnline || funnelOffline)) {
                              return (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                  {funnelOnline && funnelOnline.metrics.length > 0 && (
                                    <SalesFunnel
                                      title="Funil Online"
                                      icon={Globe}
                                      metrics={funnelOnline.metrics}
                                      monthlyValues={mergedMonthlyValues}
                                      accumulatedValues={mergedAccumulatedValues}
                                      selectedMonth={selectedMonth}
                                      selectedYear={selectedYear}
                                      historyData={historyData}
                                      monthlyTargets={monthlyTargets}
                                      onCardClick={(metric) => setDrilldownMetric(metric)}
                                      colorScheme="blue"
                                    />
                                  )}
                                  {funnelOffline && funnelOffline.metrics.length > 0 && (
                                    <SalesFunnel
                                      title="Funil Offline"
                                      icon={Building2}
                                      metrics={funnelOffline.metrics}
                                      monthlyValues={mergedMonthlyValues}
                                      accumulatedValues={mergedAccumulatedValues}
                                      selectedMonth={selectedMonth}
                                      selectedYear={selectedYear}
                                      historyData={historyData}
                                      monthlyTargets={monthlyTargets}
                                      onCardClick={(metric) => setDrilldownMetric(metric)}
                                      colorScheme="amber"
                                    />
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {organizedSubcategories.filter(s => s.name !== "Funil Online" && s.name !== "Funil Offline").map((subcat) => {
                        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                        const selectedMonthName = selectedMonth ? monthNames[selectedMonth - 1] : undefined;

                        // Sections that should be collapsible and minimized by default
                        const collapsibleSections = ["Receita Recorrente", "Tickets Médios", "Indicadores de Rentabilidade", "Saúde Financeira", "Outros Indicadores"];
                        const isCollapsible = true;

                        // Compute Receita Total as sum of revenue subcategories
                        const isReceitaTotal = category === "lucratividade" && subcat.name === "Receita Total";
                        const revenueSubcats = ["Assessoria", "Consultoria", "Pontual", "Sucumbência"];

                        const getReceitaTotalMetrics = () => {
                          if (!isReceitaTotal) return subcat.metrics;
                          return subcat.metrics.map((metric) => {
                            if (!metric.name.includes("Receita Total")) return metric;
                            // Sum all revenue metrics from other subcategories
                            const revenueMetrics = organizedSubcategories.
                            filter((s) => revenueSubcats.includes(s.name)).
                            flatMap((s) => s.metrics);

                            const computedMonthly = revenueMetrics.reduce((sum, m) => sum + (monthlyValues[m.id] ?? 0), 0);
                            const computedAccumulated = revenueMetrics.reduce((sum, m) => sum + (accumulatedValues[m.id] ?? 0), 0);

                            return {
                              ...metric,
                              current_value: selectedMonth === null ? computedAccumulated : metric.current_value,
                              _computedMonthly: computedMonthly,
                              _computedAccumulated: computedAccumulated
                            };
                          });
                        };

                        const displayMetrics = getReceitaTotalMetrics();

                        return (
                          <CollapsibleSubcategory
                            key={subcat.name}
                            name={subcat.name}
                            count={displayMetrics.length}
                            collapsible={isCollapsible}
                            defaultCollapsed={false}>

                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event: DragEndEvent) => {
                              if (!event.over || event.active.id === event.over.id) return;
                              // Find the target subcategory for the dropped card
                              const metricId = event.active.id as string;
                              // Determine new sort order based on position
                              const overMetricId = event.over.id as string;
                              const overIndex = displayMetrics.findIndex((m) => m.id === overMetricId);
                              updateAssignment.mutate({
                                metric_id: metricId,
                                subcategory_id: subcat.id,
                                sort_order: overIndex >= 0 ? overIndex : 0
                              });
                            }}>
                                <SortableContext items={displayMetrics.map((m) => m.id)} strategy={rectSortingStrategy}>
                                <div className="dashboard-grid px-0">
                                  {displayMetrics.map((metric, metricIndex) => {
                                    const isAutoSum = isReceitaTotal && metric.name.includes("Receita Total");
                                    const computedMonthly = (metric as any)._computedMonthly;
                                    const computedAccumulated = (metric as any)._computedAccumulated;

                                    let dynamicMetric = metric;
                                    const currentMonth = selectedMonth ?? new Date().getMonth() + 1;

                                    // Compute "Total de Contratos" = sum of all Novos Contratos
                                    const isTotalContratos = metric.id === TOTAL_CONTRATOS_ID;
                                    if (isTotalContratos) {
                                      const empAss = monthlyValues[CONTRATOS_EMP_ASSESSORIA_ID] ?? 0;
                                      const empConsult = monthlyValues[CONTRATOS_EMP_CONSULTORIA_ID] ?? 0;
                                      const tribAss = monthlyValues[CONTRATOS_TRIB_ASSESSORIA_ID] ?? 0;
                                      const tribPont = monthlyValues[CONTRATOS_TRIB_PONTUAL_ID] ?? 0;
                                      const trabAss = monthlyValues[CONTRATOS_TRAB_ASSESSORIA_ID] ?? 0;
                                      const trabConsult = monthlyValues[CONTRATOS_TRAB_CONSULTORIA_ID] ?? 0;
                                      const totalContratos = empAss + empConsult + tribAss + tribPont + trabAss + trabConsult;
                                      dynamicMetric = { ...dynamicMetric, current_value: totalContratos };

                                      // Dynamic target: sum of monthly targets from component metrics
                                      const componentIds = [CONTRATOS_EMP_ASSESSORIA_ID, CONTRATOS_EMP_CONSULTORIA_ID, CONTRATOS_TRAB_ASSESSORIA_ID, CONTRATOS_TRAB_CONSULTORIA_ID, CONTRATOS_TRIB_ASSESSORIA_ID, CONTRATOS_TRIB_PONTUAL_ID];
                                      if (monthlyTargets) {
                                        if (selectedMonth !== null) {
                                          const sumTarget = componentIds.reduce((sum, id) => {
                                            const mt = monthlyTargets.find(t => t.metric_id === id && t.month === currentMonth && t.year === selectedYear);
                                            return sum + (mt?.target_value ?? 0);
                                          }, 0);
                                          dynamicMetric = { ...dynamicMetric, target_value: sumTarget * 12 };
                                        } else {
                                          const sumTarget = componentIds.reduce((sum, id) => {
                                            const mts = monthlyTargets.filter(t => t.metric_id === id && t.year === selectedYear);
                                            return sum + mts.reduce((s, t) => s + t.target_value, 0);
                                          }, 0);
                                          dynamicMetric = { ...dynamicMetric, target_value: sumTarget };
                                        }
                                      }
                                    }

                                    // For "Total de Contratos", compute monthly value
                                    const totalContratosMonthly = isTotalContratos ?
                                    (monthlyValues[CONTRATOS_EMP_ASSESSORIA_ID] ?? 0) + (
                                    monthlyValues[CONTRATOS_EMP_CONSULTORIA_ID] ?? 0) + (
                                    monthlyValues[CONTRATOS_TRIB_ASSESSORIA_ID] ?? 0) + (
                                    monthlyValues[CONTRATOS_TRIB_PONTUAL_ID] ?? 0) + (
                                    monthlyValues[CONTRATOS_TRAB_ASSESSORIA_ID] ?? 0) + (
                                    monthlyValues[CONTRATOS_TRAB_CONSULTORIA_ID] ?? 0) :
                                    null;

                                    // Compute MRR % Mensal = (Assessoria Emp + Trab + Trib) / Receita Total * 100
                                    const isMRR = metric.id === MRR_METRIC_ID;
                                    let mrrMonthlyValue: number | null = null;
                                    let mrrAccumulatedValue = 0;
                                    if (isMRR) {
                                      // Get all revenue metrics from subcategories for Receita Total denominator
                                       const revenueSubcatNames = ["Assessoria", "Consultoria", "Pontual", "Sucumbência"];
                                      const allRevenueMetrics = organizedSubcategories.
                                      filter((s) => revenueSubcatNames.includes(s.name)).
                                      flatMap((s) => s.metrics);

                                      if (selectedMonth !== null) {
                                        const assessoriaSum = (monthlyValues[RECEITA_EMP_ASSESSORIA_ID] ?? 0) + (monthlyValues[RECEITA_TRAB_ASSESSORIA_ID] ?? 0) + (monthlyValues[RECEITA_TRIB_ASSESSORIA_ID] ?? 0);
                                        const receitaTotal = allRevenueMetrics.reduce((sum, m) => sum + (monthlyValues[m.id] ?? 0), 0);
                                        mrrMonthlyValue = receitaTotal > 0 ? assessoriaSum / receitaTotal * 100 : 0;
                                      }
                                      // Accumulated: weighted average across months with data
                                      const assessoriaAccum = (accumulatedValues[RECEITA_EMP_ASSESSORIA_ID] ?? 0) + (accumulatedValues[RECEITA_TRAB_ASSESSORIA_ID] ?? 0) + (accumulatedValues[RECEITA_TRIB_ASSESSORIA_ID] ?? 0);
                                      const receitaTotalAccum = allRevenueMetrics.reduce((sum, m) => sum + (accumulatedValues[m.id] ?? 0), 0);
                                      mrrAccumulatedValue = receitaTotalAccum > 0 ? assessoriaAccum / receitaTotalAccum * 100 : 0;

                                      dynamicMetric = { ...dynamicMetric, current_value: mrrAccumulatedValue };
                                    }

                                    // Compute ARR % Anual = receita recorrente (assessoria) acumulada / receita total realizada acumulada * 100
                                    const isARR = metric.id === ARR_METRIC_ID;
                                    let arrMonthlyValue: number | null = null;
                                    let arrAccumulatedValue = 0;
                                    if (isARR) {
                                      const assessoriaIds = [RECEITA_EMP_ASSESSORIA_ID, RECEITA_TRAB_ASSESSORIA_ID, RECEITA_TRIB_ASSESSORIA_ID];

                                      // Receita recorrente (assessoria) acumulada
                                      const assessoriaAccum = assessoriaIds.reduce((sum, id) => sum + (accumulatedValues[id] ?? 0), 0);

                                      // Receita total realizada acumulada (todas as receitas)
                                      const revenueSubcatNames = ["Assessoria", "Consultoria", "Pontual", "Sucumbência"];
                                      const allRevenueMetrics = organizedSubcategories
                                        .filter((s) => revenueSubcatNames.includes(s.name))
                                        .flatMap((s) => s.metrics);
                                      const receitaTotalAccum = allRevenueMetrics.reduce((sum, m) => sum + (accumulatedValues[m.id] ?? 0), 0);

                                      arrAccumulatedValue = receitaTotalAccum > 0 ? assessoriaAccum / receitaTotalAccum * 100 : 0;

                                      arrMonthlyValue = arrAccumulatedValue;
                                      dynamicMetric = { ...dynamicMetric, current_value: arrAccumulatedValue };
                                    }

                                    const isOriginCard = metric.id === CONTRATOS_ONLINE_ID || metric.id === CONTRATOS_OFFLINE_ID;
                                    const originMonthly = metric.id === CONTRATOS_ONLINE_ID ? originValues.online.monthly : metric.id === CONTRATOS_OFFLINE_ID ? originValues.offline.monthly : null;
                                    const originAccumulated = metric.id === CONTRATOS_ONLINE_ID ? originValues.online.accumulated : metric.id === CONTRATOS_OFFLINE_ID ? originValues.offline.accumulated : 0;

                                    // Compute Resultado Acumulado ASF and Eficiência de Receita ASF
                                    const isResultadoAcumulado = metric.id === RESULTADO_ACUMULADO_ID;
                                    const isEficienciaReceita = metric.id === EFICIENCIA_RECEITA_ID;
                                     let resultadoAcumuladoValue = 0;
                                     let resultadoPrevisto = 0;
                                     let resultadoRealizado = 0;
                                     let eficienciaReceitaValue = 0;
                                     let eficienciaProjecao = 0;

                                     if (isResultadoAcumulado || isEficienciaReceita) {
                                       // Get all revenue metrics for computing totals
                                       const revenueSubcatNames = ["Assessoria", "Consultoria", "Pontual", "Sucumbência"];
                                       const allRevenueMetrics = organizedSubcategories.
                                       filter((s) => revenueSubcatNames.includes(s.name)).
                                       flatMap((s) => s.metrics);

                                       const currentMonthRef = selectedMonth ?? new Date().getMonth() + 1;

                                       // For each month BEFORE currentMonthRef (exclude current month)
                                       for (let mo = 1; mo < currentMonthRef; mo++) {
                                         let monthRealizado = 0;
                                         let monthMeta = 0;
                                         allRevenueMetrics.forEach((rm) => {
                                           historyData?.forEach((h: any) => {
                                             const ref = getRefMonthYear(h.period_type, h.recorded_at);
                                             if (ref.year === selectedYear && ref.month === mo && h.metric_id === rm.id) {
                                               monthRealizado += h.value;
                                             }
                                           });
                                           const mt = monthlyTargets?.find((t) => t.metric_id === rm.id && t.month === mo && t.year === selectedYear);
                                           monthMeta += mt?.target_value ?? 0;
                                         });
                                         resultadoPrevisto += monthMeta;
                                         resultadoRealizado += monthRealizado;
                                       }
                                       resultadoAcumuladoValue = resultadoRealizado - resultadoPrevisto;

                                       // Eficiência de Receita = Realizado / Meta * 100 (mês a mês)
                                       const receitaTotalMetric = metrics?.find((m) => m.id === RECEITA_TOTAL_MENSAL_ID);
                                       const metaAnual = receitaTotalMetric?.target_value || 2218000;

                                       if (selectedMonth !== null) {
                                         // Monthly: realizado do mês / meta do mês
                                         let monthRealizado = 0;
                                         allRevenueMetrics.forEach((rm) => {
                                           historyData?.forEach((h: any) => {
                                             const ref = getRefMonthYear(h.period_type, h.recorded_at);
                                             if (ref.year === selectedYear && ref.month === selectedMonth && h.metric_id === rm.id) {
                                               monthRealizado += h.value;
                                             }
                                           });
                                         });
                                         const metaMes = monthlyTargets?.find((t) => t.metric_id === RECEITA_TOTAL_MENSAL_ID && t.month === selectedMonth && t.year === selectedYear)?.target_value ?? 0;
                                         eficienciaReceitaValue = metaMes > 0 ? monthRealizado / metaMes * 100 : 0;
                                       } else {
                                         // Annual: realizado acumulado / meta acumulada (soma das metas mensais até agora)
                                         const receitaAcumulada = allRevenueMetrics.reduce((sum, m) => sum + (accumulatedValues[m.id] ?? 0), 0);
                                         let metaAcumulada = 0;
                                         for (let mo = 1; mo < currentMonthRef; mo++) {
                                           const mt = monthlyTargets?.find((t) => t.metric_id === RECEITA_TOTAL_MENSAL_ID && t.month === mo && t.year === selectedYear);
                                           metaAcumulada += mt?.target_value ?? 0;
                                         }
                                         eficienciaReceitaValue = metaAcumulada > 0 ? receitaAcumulada / metaAcumulada * 100 : 0;
                                       }

                                       if (isResultadoAcumulado) {
                                         dynamicMetric = { ...dynamicMetric, current_value: resultadoAcumuladoValue, target_value: metaAnual };
                                       }
                                       if (isEficienciaReceita) {
                                         dynamicMetric = { ...dynamicMetric, current_value: eficienciaReceitaValue, target_value: 100 };
                                       }
                                     }

                                    // Compute Receita Empresarial/Trabalhista/Tributário as sum of sub-metrics
                                    const isReceitaEmp = metric.id === RECEITA_EMP_ID;
                                    const isReceitaTrab = metric.id === RECEITA_TRAB_ID;
                                    const isReceitaTrib = metric.id === RECEITA_TRIB_ID;
                                    const isReceitaTotalAnual = metric.id === RECEITA_TOTAL_MENSAL_ID;
                                    let revSumMonthly: number | null = null;
                                    let revSumAccumulated = 0;

                                    const sumComponents = (ids: string[], source: Record<string, number>) =>
                                    ids.reduce((sum, id) => sum + (source[id] ?? 0), 0);

                                    if (isReceitaEmp) {
                                      revSumMonthly = selectedMonth !== null ? sumComponents(RECEITA_EMP_COMPONENTS, monthlyValues) : null;
                                      revSumAccumulated = sumComponents(RECEITA_EMP_COMPONENTS, accumulatedValues);
                                      dynamicMetric = { ...dynamicMetric, current_value: revSumAccumulated };
                                    } else if (isReceitaTrab) {
                                      revSumMonthly = selectedMonth !== null ? sumComponents(RECEITA_TRAB_COMPONENTS, monthlyValues) : null;
                                      revSumAccumulated = sumComponents(RECEITA_TRAB_COMPONENTS, accumulatedValues);
                                      dynamicMetric = { ...dynamicMetric, current_value: revSumAccumulated };
                                    } else if (isReceitaTrib) {
                                      revSumMonthly = selectedMonth !== null ? sumComponents(RECEITA_TRIB_COMPONENTS, monthlyValues) : null;
                                      revSumAccumulated = sumComponents(RECEITA_TRIB_COMPONENTS, accumulatedValues);
                                      dynamicMetric = { ...dynamicMetric, current_value: revSumAccumulated };
                                    } else if (isReceitaTotalAnual) {
                                      // Receita Total = Receita Emp + Trab + Trib + Outras Receitas
                                      const allRevIds = [...RECEITA_EMP_COMPONENTS, ...RECEITA_TRAB_COMPONENTS, ...RECEITA_TRIB_COMPONENTS, OUTRAS_RECEITAS_ID];
                                      revSumMonthly = selectedMonth !== null ? sumComponents(allRevIds, monthlyValues) : null;
                                      revSumAccumulated = sumComponents(allRevIds, accumulatedValues);
                                      dynamicMetric = { ...dynamicMetric, current_value: revSumAccumulated };
                                    }

                                    const isRevSumCard = isReceitaEmp || isReceitaTrab || isReceitaTrib || isReceitaTotalAnual;
                                    const isPipelineCard = !!(PIPELINE_METRIC_MAP[metric.id] || PIPELINE_AREA_MAP[metric.id] || metric.id === TAXA_AGENDAMENTO_ID || metric.id === TAXA_COMPARECIMENTO_ID || metric.id === TAXA_CONVERSAO_ID || metric.id === TEMPO_MEDIO_FECHAMENTO_ID);
                                    const isComputedCard = isAutoSum || isTotalContratos || isMRR || isARR || isOriginCard || isResultadoAcumulado || isEficienciaReceita || isRevSumCard || isPipelineCard;

                                    const isReceitaTotalCard = metric.name.includes("Receita Total");
                                    const cardMonthlyValue = isAutoSum ? computedMonthly : isTotalContratos ? totalContratosMonthly : isMRR ? mrrMonthlyValue : isARR ? arrMonthlyValue : isOriginCard ? originMonthly : isResultadoAcumulado ? resultadoAcumuladoValue : isEficienciaReceita ? eficienciaReceitaValue : isRevSumCard ? revSumMonthly : mergedMonthlyValues[metric.id] ?? null;
                                    const cardAccumulatedValue = isAutoSum ? computedAccumulated ?? 0 : isTotalContratos ? totalContratosMonthly ?? 0 : isMRR ? mrrAccumulatedValue : isARR ? arrAccumulatedValue : isOriginCard ? originAccumulated : isResultadoAcumulado ? resultadoAcumuladoValue : isEficienciaReceita ? eficienciaReceitaValue : isRevSumCard ? revSumAccumulated : mergedAccumulatedValues[metric.id] ?? 0;
                                    const cardMetric = isAutoSum ? { ...dynamicMetric, current_value: computedAccumulated ?? 0 } : dynamicMetric;

                                    // Pre-compute monthly target for this metric
                                    let cardMonthlyTarget = selectedMonth && monthlyTargets ?
                                    monthlyTargets.find((t) => t.metric_id === metric.id && t.month === selectedMonth && t.year === selectedYear)?.target_value ?? null :
                                    null;

                                    // For Total de Contratos, compute target dynamically from component metrics
                                    if (isTotalContratos && selectedMonth && monthlyTargets) {
                                      const componentIds = [CONTRATOS_EMP_ASSESSORIA_ID, CONTRATOS_EMP_CONSULTORIA_ID, CONTRATOS_TRAB_ASSESSORIA_ID, CONTRATOS_TRAB_CONSULTORIA_ID, CONTRATOS_TRIB_ASSESSORIA_ID, CONTRATOS_TRIB_PONTUAL_ID];
                                      cardMonthlyTarget = componentIds.reduce((sum, id) => {
                                        const mt = monthlyTargets.find(t => t.metric_id === id && t.month === selectedMonth && t.year === selectedYear);
                                        return sum + (mt?.target_value ?? 0);
                                      }, 0);
                                    }

                                    return (
                                      <DraggableCardWrapper key={metric.id} id={metric.id} isDragMode={isDragMode} currentSubcategoryId={subcat.id} availableSubcategories={organizedSubcategories.map((s) => ({ id: s.id, name: s.name }))} onMoveToSubcategory={(metricId, subcategoryId) => {updateAssignment.mutate({ metric_id: metricId, subcategory_id: subcategoryId, sort_order: 0 });}}>
                                    <div
                                          data-tour={metricIndex === 0 && category === "lucratividade" ? "metric-card" : undefined}
                                          className="h-full">
                                        <CircularProgressCard
                                            metric={cardMetric}
                                            monthlyValue={cardMonthlyValue}
                                            isMonthSelected={selectedMonth !== null}
                                            accumulatedValue={cardAccumulatedValue}
                                            selectedMonthName={selectedMonthName}
                                            historyData={historyData}
                                            selectedYear={selectedYear}
                                            selectedMonth={selectedMonth}
                                            monthlyTargets={monthlyTargets}
                                            monthlyTargetOverride={cardMonthlyTarget}
                                            onCardClick={isComputedCard && !isReceitaTotalAnual ? undefined : () => setDrilldownMetric(metric)}
                                            hideTarget={isResultadoAcumulado}
                                            forecastValue={isReceitaTotalAnual ? (forecastValues[metric.id] ?? null) : undefined}
                                            hideValues={category === "lucratividade" && !showFinancialValues}
                                            forceAnnualLabel={isARR || isResultadoAcumulado}
                                            resultadoData={isResultadoAcumulado ? { previsto: resultadoPrevisto, realizado: resultadoRealizado, resultado: resultadoAcumuladoValue } : null} />
                                    </div>
                                  </DraggableCardWrapper>);

                                  })}
                                </div>
                                </SortableContext>
                                </DndContext>
                              </CollapsibleSubcategory>);

                      })}
                          

                          {category === "gestao_pessoas" && trainingHours && trainingHours.length > 0 &&
                      <div className="mt-4 sm:mt-6">
                              <SubcategoryHeader name="Horas de Treinamento" count={trainingHours.length} />
                              <div className="dashboard-grid">
                                <TrainingCardEditable items={trainingHours} />
                              </div>
                            </div>
                      }
                        </>
                    }
                    </TabsContent>);

              })}

                {/* Secret Commission Tab Content */}
                {isCommissionUser && activeTab === "comissao" &&
              <TabsContent value="comissao" className="mt-0 bg-card border border-t-0 border-border/50 rounded-b-xl p-2.5 sm:p-3 animate-fade-in">
                    <CommissionTab
                  metrics={adjustedMetrics}
                  historyData={historyData}
                  monthlyTargets={monthlyTargets}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  monthlyValues={monthlyValues}
                  accumulatedValues={accumulatedValues} />

                  </TabsContent>
              }

                {/* SDR Commission Tab Content */}
                {isSDRUser && activeTab === "comissao_sdr" &&
              <TabsContent value="comissao_sdr" className="mt-0 bg-card border border-t-0 border-border/50 rounded-b-xl p-2.5 sm:p-3 animate-fade-in">
                    <SDRCommissionTab
                  metrics={adjustedMetrics}
                  monthlyTargets={monthlyTargets}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  monthlyValues={monthlyValues}
                  accumulatedValues={accumulatedValues} />

                  </TabsContent>
              }
              </Tabs>
            </SwipeableTabs>
          </>
        }
      </div>
      
      {/* Metric Drilldown Dialog */}
      {drilldownMetric &&
      <MetricDrilldownDialog
        metric={drilldownMetric}
        open={!!drilldownMetric}
        onOpenChange={(open) => {if (!open) setDrilldownMetric(null);}}
        canEdit={hasTabAccess(drilldownMetric.category, "edit")}
        canDelete={hasTabAccess(drilldownMetric.category, "delete")} />

      }

      {/* Sync Status Footer */}
      <SyncStatusFooter
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSync={handleSync}
        lastSyncedAt={lastSyncedAt} />

      {/* Subcategory Manager Dialog */}
      <SubcategoryManagerDialog open={showSubcatManager} onOpenChange={setShowSubcatManager} />

    </div>);

};

export default Index;