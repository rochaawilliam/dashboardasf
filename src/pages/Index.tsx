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
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Users,
  Zap,
  GraduationCap,
  Rocket,
  Briefcase,
  Lock,
  LogIn,
  Target,
  TrendingUp } from
"lucide-react";
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

const categoryConfig: Record<MetricCategory, {title: string;shortTitle: string;subtitle: string;icon: any;variant: "primary" | "accent" | "success" | "warning";}> = {
  lucratividade: {
    title: "Lucratividade",
    shortTitle: "Lucro",
    subtitle: "Aumentar lucratividade e margem do negócio",
    icon: DollarSign,
    variant: "primary"
  },
  execucao_comercial: {
    title: "Execução Comercial",
    shortTitle: "Comercial",
    subtitle: "Acompanhar pipeline e conversão de vendas",
    icon: Briefcase,
    variant: "accent"
  },
  experiencia_cliente: {
    title: "Gestão de Crescimento",
    shortTitle: "Crescimento",
    subtitle: "Entregar experiência consistente e previsível",
    icon: Rocket,
    variant: "accent"
  },
  produtividade: {
    title: "Produtividade",
    shortTitle: "Produtiv.",
    subtitle: "Garantir eficiência do time jurídico",
    icon: Zap,
    variant: "warning"
  },
  gestao_pessoas: {
    title: "Gestão de Pessoas",
    shortTitle: "Pessoas",
    subtitle: "Construir um time estável, produtivo e engajado",
    icon: Users,
    variant: "success"
  },
  aprendizado_crescimento: {
    title: "Aprendizado e Crescimento",
    shortTitle: "Aprend.",
    subtitle: "Desenvolver competências técnicas e lideranças internas",
    icon: GraduationCap,
    variant: "primary"
  }
};

const categoryOrder: MetricCategory[] = [
"lucratividade",
"execucao_comercial",
"experiencia_cliente",
"produtividade",
"gestao_pessoas",
"aprendizado_crescimento"];


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
  const [activeTab, setActiveTab] = useState<MetricCategory | "comissao" | "comissao_sdr">("lucratividade");
  const isCommissionUser = user?.email === COMMISSION_USER_EMAIL;
  const isSDRUser = SDR_ALLOWED_EMAILS.includes(user?.email ?? "");
  const [drilldownMetric, setDrilldownMetric] = useState<typeof adjustedMetrics[number] | null>(null);

  // Month/Year selection state
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: metrics, isLoading: metricsLoading } = useMetrics(filters);
  const { data: historyData, isLoading: historyLoading } = useMetricHistory(undefined, filters);
  const { data: trainingHours, isLoading: trainingLoading } = useTrainingHours(filters);
  const { data: monthlyTargets } = useMonthlyTargets();

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
      const ref = getRefMonthYear(h.period_type, h.recorded_at);
      if (ref.year === selectedYear) {
        values[h.metric_id] = (values[h.metric_id] || 0) + h.value;
      }
    });
    return values;
  }, [historyData, selectedYear]);

  // IDs for "mês anterior" computed metrics
  const CONTRATOS_EMP_MES_ANT_ID = "aaa6fbd3-75bc-43ce-9391-fd0f26ace960";
  const CONTRATOS_TRAB_MES_ANT_ID = "290aec39-539f-4f74-a8bc-33ed2db89de0";

  // IDs for contract metrics used in the sum
  const CONTRATOS_EMP_ASSESSORIA_ID = "f80d5c78-cf50-4aca-befb-5808b6557d8e";
  const CONTRATOS_EMP_CONSULTORIA_ID = "90726f8c-8cf7-47d8-81b6-c6f22c4eeef5";
  const CONTRATOS_TRAB_ASSESSORIA_ID = "ae64d582-a08d-442c-998e-b6bc214e486e";
  const CONTRATOS_TRAB_CONSULTORIA_ID = "0ffeaffb-ab3c-4371-be5b-172f57160ec4";

  // IDs for Total Contratos Assessoria
  const TOTAL_EMP_ASSESSORIA_ID = "b1c2d3e4-f5a6-7890-abcd-ef1234567890";
  const TOTAL_TRAB_ASSESSORIA_ID = "c2d3e4f5-a6b7-8901-bcde-f12345678901";

  // ID for "Total de Contratos" (computed)
  const TOTAL_CONTRATOS_ID = "d3e4f5a6-b7c8-9012-cdef-234567890abc";

  // IDs for tributário metrics used in Total de Contratos
  const CONTRATOS_TRIB_ASSESSORIA_ID = "a1102d97-a2a6-44d6-8ac7-716cc1474d16";
  const CONTRATOS_TRIB_PONTUAL_ID = "95280373-3e3b-4596-b2c4-ce8e01ee1b2c";

  // Compute previous month's contract values from history
  const prevMonthContractValues = useMemo(() => {
    const refMonth = selectedMonth ?? new Date().getMonth() + 1;

    // Fixed increment: Jan=20/14, Feb=21/15, Mar=22/16, etc.
    return {
      empresarial: 20 + (refMonth - 1),
      trabalhista: 14 + (refMonth - 1)
    };
  }, [selectedMonth]);

  // Create metrics with adjusted values based on selection
  const adjustedMetrics = useMemo(() => {
    if (!metrics) return [];

    return metrics.map((metric) => {
      let currentValue = selectedMonth === null ?
      accumulatedValues[metric.id] ?? 0 :
      metric.current_value;

      // Compute "mês anterior" card values
      if (metric.id === CONTRATOS_EMP_MES_ANT_ID) {
        currentValue = prevMonthContractValues.empresarial;
      } else if (metric.id === CONTRATOS_TRAB_MES_ANT_ID) {
        currentValue = prevMonthContractValues.trabalhista;
      }

      return {
        ...metric,
        current_value: currentValue
      };
    });
  }, [metrics, selectedMonth, accumulatedValues, prevMonthContractValues]);

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
        <div className="max-w-[1472px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      
      
      <div className="max-w-[1472px] mx-auto px-2 sm:px-3 md:px-5 py-3 sm:py-4 md:py-[12px] lg:px-[12px]">
        <div data-tour="header">
          <DashboardHeader
            metrics={adjustedMetrics}
            historyData={historyData}
            selectedYear={selectedYear}
            mobileDrawer={
            <div data-tour="mobile-menu">
                <MobileDrawer
                activeTab={activeTab === "comissao" || activeTab === "comissao_sdr" ? "lucratividade" : activeTab}
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
            trainingHours={trainingHours} />

          </div>
        }
        
        <div data-tour="filters">
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            onPrint={handlePrint} />

        </div>
        
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
              activeTab={activeTab === "comissao" || activeTab === "comissao_sdr" ? "lucratividade" : activeTab}
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
            activeTab={activeTab === "comissao" || activeTab === "comissao_sdr" ? "lucratividade" : activeTab}
            onTabChange={(tab) => setActiveTab(tab as MetricCategory)}>

              <Tabs value={activeTab === "comissao" ? "comissao" : activeTab === "comissao_sdr" ? "comissao_sdr" : activeTab} onValueChange={(v) => setActiveTab(v as MetricCategory | "comissao" | "comissao_sdr")} className="mb-3 sm:mb-4">
                {/* Chrome-style tabs - full width */}
                <div data-tour="category-tabs" className="flex items-end bg-muted/30 rounded-t-xl pt-1 px-1 gap-0.5">
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
                        "flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-t-lg transition-all relative",
                        "text-[9px] sm:text-xs font-medium",
                        !canAccess && "opacity-50 cursor-not-allowed",
                        isActive && canAccess ?
                        "bg-primary text-primary-foreground shadow-sm z-10" :
                        canAccess ?
                        "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground" :
                        "bg-muted/30 text-muted-foreground"
                      )}
                      title={!canAccess ? "Acesso restrito - Entre em contato com o administrador" : config.title}>

                        {!canAccess ?
                      <Lock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> :

                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      }
                    <span className="hidden sm:inline truncate">{config.shortTitle}</span>
                        <span className={cn(
                        "hidden sm:inline text-[7px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full font-semibold",
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
                const organizedSubcategories = organizeMetricsBySubcategory(categoryMetrics, category);

                return (
                  <TabsContent key={category} value={category} className="mt-0 bg-card border border-t-0 border-border/50 rounded-b-xl rounded-tr-xl p-2.5 sm:p-3 animate-fade-in">
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
                          <SectionHeader
                        title={config.title}
                        subtitle={config.subtitle}
                        icon={config.icon}
                        variant={config.variant} />

                      
                          {organizedSubcategories.map((subcat) => {
                        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                        const selectedMonthName = selectedMonth ? monthNames[selectedMonth - 1] : undefined;

                        // Sections that should be collapsible and minimized by default
                        const collapsibleSections = ["Receita Recorrente", "Tickets Médios", "Indicadores de Rentabilidade", "Saúde Financeira", "Outros Indicadores"];
                        const isCollapsible = true;

                        // Compute Receita Total as sum of revenue subcategories
                        const isReceitaTotal = category === "lucratividade" && subcat.name === "Receita Total";
                        const revenueSubcats = ["Assessoria", "Consultoria", "Pontual", "Sucumbência", "Patenteia"];

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

                                <div className="dashboard-grid px-0">
                                  {displayMetrics.map((metric, metricIndex) => {
                                const isAutoSum = isReceitaTotal && metric.name.includes("Receita Total");
                                const computedMonthly = (metric as any)._computedMonthly;
                                const computedAccumulated = (metric as any)._computedAccumulated;

                                // "Mês anterior" cards are read-only computed cards
                                const isMesAnterior = metric.id === CONTRATOS_EMP_MES_ANT_ID || metric.id === CONTRATOS_TRAB_MES_ANT_ID;

                                let dynamicMetric = metric;
                                const currentMonth = selectedMonth ?? new Date().getMonth() + 1;

                                // Dynamic target for Assessoria metrics: Jan=0, Feb+=1
                                if (metric.id === CONTRATOS_EMP_ASSESSORIA_ID) {
                                  dynamicMetric = { ...metric, target_value: currentMonth >= 2 ? 1 : 0 };
                                } else if (metric.id === CONTRATOS_TRAB_ASSESSORIA_ID) {
                                  dynamicMetric = { ...metric, target_value: currentMonth >= 2 ? 1 : 0 };
                                }

                                // Dynamic target for "Mês Anterior": Jan=sem meta(0), Feb+=base+increment
                                if (metric.id === CONTRATOS_EMP_MES_ANT_ID) {
                                  const mesAnteriorTarget = currentMonth >= 2 ? 20 + (currentMonth - 1) : 0;
                                  dynamicMetric = { ...dynamicMetric, target_value: mesAnteriorTarget };
                                } else if (metric.id === CONTRATOS_TRAB_MES_ANT_ID) {
                                  const mesAnteriorTarget = currentMonth >= 2 ? 14 + (currentMonth - 1) : 0;
                                  dynamicMetric = { ...dynamicMetric, target_value: mesAnteriorTarget };
                                }

                                // Compute "Total Contratos Assessoria" = Mês Anterior + Novos Contratos Assessoria
                                const isTotalAssessoria = metric.id === TOTAL_EMP_ASSESSORIA_ID || metric.id === TOTAL_TRAB_ASSESSORIA_ID;
                                if (metric.id === TOTAL_EMP_ASSESSORIA_ID) {
                                  const novosEmp = monthlyValues[CONTRATOS_EMP_ASSESSORIA_ID] ?? 0;
                                  const totalEmp = prevMonthContractValues.empresarial + novosEmp;
                                  dynamicMetric = { ...metric, target_value: 0, current_value: totalEmp };
                                } else if (metric.id === TOTAL_TRAB_ASSESSORIA_ID) {
                                  const novosTrab = monthlyValues[CONTRATOS_TRAB_ASSESSORIA_ID] ?? 0;
                                  const totalTrab = prevMonthContractValues.trabalhista + novosTrab;
                                  dynamicMetric = { ...metric, target_value: 0, current_value: totalTrab };
                                }

                                // Compute "Total de Contratos" = Total Emp Assessoria + Trib Assessoria + Trib Pontual + Total Trab Assessoria
                                const isTotalContratos = metric.id === TOTAL_CONTRATOS_ID;
                                if (isTotalContratos) {
                                  const totalEmpAss = prevMonthContractValues.empresarial + (monthlyValues[CONTRATOS_EMP_ASSESSORIA_ID] ?? 0);
                                  const empConsult = monthlyValues[CONTRATOS_EMP_CONSULTORIA_ID] ?? 0;
                                  const tribAss = monthlyValues[CONTRATOS_TRIB_ASSESSORIA_ID] ?? 0;
                                  const tribPont = monthlyValues[CONTRATOS_TRIB_PONTUAL_ID] ?? 0;
                                  const totalTrabAss = prevMonthContractValues.trabalhista + (monthlyValues[CONTRATOS_TRAB_ASSESSORIA_ID] ?? 0);
                                  const trabConsult = monthlyValues[CONTRATOS_TRAB_CONSULTORIA_ID] ?? 0;
                                  const totalContratos = totalEmpAss + empConsult + tribAss + tribPont + totalTrabAss + trabConsult;
                                  dynamicMetric = { ...dynamicMetric, current_value: totalContratos };
                                }

                                // For "mês anterior", show value regardless of month selection
                                const mesAnteriorMonthly = isMesAnterior ?
                                metric.id === CONTRATOS_EMP_MES_ANT_ID ? prevMonthContractValues.empresarial : prevMonthContractValues.trabalhista :
                                null;

                                // For total assessoria, show computed value
                                const totalAssessoriaMonthly = isTotalAssessoria ?
                                metric.id === TOTAL_EMP_ASSESSORIA_ID ?
                                prevMonthContractValues.empresarial + (monthlyValues[CONTRATOS_EMP_ASSESSORIA_ID] ?? 0) :
                                prevMonthContractValues.trabalhista + (monthlyValues[CONTRATOS_TRAB_ASSESSORIA_ID] ?? 0) :
                                null;

                                // For "Total de Contratos", compute monthly value
                                const totalContratosMonthly = isTotalContratos ?
                                prevMonthContractValues.empresarial + (monthlyValues[CONTRATOS_EMP_ASSESSORIA_ID] ?? 0) + (
                                monthlyValues[CONTRATOS_EMP_CONSULTORIA_ID] ?? 0) + (
                                monthlyValues[CONTRATOS_TRIB_ASSESSORIA_ID] ?? 0) + (
                                monthlyValues[CONTRATOS_TRIB_PONTUAL_ID] ?? 0) + (
                                prevMonthContractValues.trabalhista + (monthlyValues[CONTRATOS_TRAB_ASSESSORIA_ID] ?? 0)) + (
                                monthlyValues[CONTRATOS_TRAB_CONSULTORIA_ID] ?? 0) :
                                null;

                                const isComputedCard = isAutoSum || isMesAnterior || isTotalAssessoria || isTotalContratos;

                                const isReceitaTotalCard = metric.name.includes("Receita Total");
                                const cardMonthlyValue = isAutoSum ? computedMonthly : isMesAnterior ? mesAnteriorMonthly : isTotalAssessoria ? totalAssessoriaMonthly : isTotalContratos ? totalContratosMonthly : monthlyValues[metric.id] ?? null;
                                const cardAccumulatedValue = isAutoSum ? computedAccumulated ?? 0 : isMesAnterior ? metric.id === CONTRATOS_EMP_MES_ANT_ID ? prevMonthContractValues.empresarial : prevMonthContractValues.trabalhista : isTotalAssessoria ? totalAssessoriaMonthly ?? 0 : isTotalContratos ? totalContratosMonthly ?? 0 : accumulatedValues[metric.id] ?? 0;
                                const cardMetric = isAutoSum ? { ...dynamicMetric, current_value: computedAccumulated ?? 0 } : dynamicMetric;

                                return (
                                  <div
                                    key={metric.id}
                                    data-tour={metricIndex === 0 && category === "lucratividade" ? "metric-card" : undefined}
                                    className={undefined}>

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
                                      onCardClick={isComputedCard ? undefined : () => setDrilldownMetric(metric)} />

                                      </div>);

                              })}
                                </div>
                              </CollapsibleSubcategory>);

                      })}
                          
                          {categoryHistory && categoryHistory.length > 0 && metrics &&
                      <MetricChart
                        data={categoryHistory}
                        metrics={metrics}
                        title={`Evolução - ${config.title} (${selectedYear})`} />

                      }

                          {category === "aprendizado_crescimento" && trainingHours && trainingHours.length > 0 &&
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
              <TabsContent value="comissao" className="mt-0 bg-card border border-t-0 border-border/50 rounded-b-xl rounded-tr-xl p-2.5 sm:p-3 animate-fade-in">
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
              <TabsContent value="comissao_sdr" className="mt-0 bg-card border border-t-0 border-border/50 rounded-b-xl rounded-tr-xl p-2.5 sm:p-3 animate-fade-in">
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

    </div>);

};

export default Index;