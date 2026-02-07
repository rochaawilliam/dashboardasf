import { useState, useCallback, useMemo, useEffect } from "react";
import { parseISO, format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCardMonthly } from "@/components/dashboard/MetricCardMonthly";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { SubcategoryHeader } from "@/components/dashboard/SubcategoryHeader";
import { TrainingCardEditable } from "@/components/dashboard/TrainingCardEditable";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { DataEntrySection } from "@/components/dashboard/DataEntrySection";
import { MetricChart } from "@/components/dashboard/MetricChart";
import { PrintStyles } from "@/components/dashboard/PrintStyles";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { MonthsSummary } from "@/components/dashboard/MonthsSummary";
import { MobileDrawer } from "@/components/dashboard/MobileDrawer";
import { SwipeableTabs } from "@/components/dashboard/SwipeableTabs";
import { AutoStartTour } from "@/components/dashboard/GuidedTour";
import { useOfflineCache, usePendingMutations, useOnlineStatus } from "@/hooks/useOfflineMode";
import { SyncStatusFooter } from "@/components/dashboard/SyncStatusFooter";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import {
  useMetrics,
  useMetricHistory,
  useTrainingHours,
  type Filters,
  type MetricCategory,
} from "@/hooks/useMetrics";
import { useMetricNotifications } from "@/hooks/useMetricNotifications";

const categoryConfig: Record<MetricCategory, { title: string; shortTitle: string; subtitle: string; icon: any; variant: "primary" | "accent" | "success" | "warning" }> = {
  lucratividade: {
    title: "Lucratividade",
    shortTitle: "Lucro",
    subtitle: "Aumentar lucratividade e margem do negócio",
    icon: DollarSign,
    variant: "primary",
  },
  execucao_comercial: {
    title: "Execução Comercial",
    shortTitle: "Comercial",
    subtitle: "Acompanhar pipeline e conversão de vendas",
    icon: Briefcase,
    variant: "accent",
  },
  experiencia_cliente: {
    title: "Gestão de Crescimento",
    shortTitle: "Crescimento",
    subtitle: "Entregar experiência consistente e previsível",
    icon: Rocket,
    variant: "accent",
  },
  produtividade: {
    title: "Produtividade",
    shortTitle: "Produtiv.",
    subtitle: "Garantir eficiência do time jurídico",
    icon: Zap,
    variant: "warning",
  },
  gestao_pessoas: {
    title: "Gestão de Pessoas",
    shortTitle: "Pessoas",
    subtitle: "Construir um time estável, produtivo e engajado",
    icon: Users,
    variant: "success",
  },
  aprendizado_crescimento: {
    title: "Aprendizado e Crescimento",
    shortTitle: "Aprend.",
    subtitle: "Desenvolver competências técnicas e lideranças internas",
    icon: GraduationCap,
    variant: "primary",
  },
};

const categoryOrder: MetricCategory[] = [
  "lucratividade",
  "execucao_comercial",
  "experiencia_cliente",
  "produtividade",
  "gestao_pessoas",
  "aprendizado_crescimento",
];

const Index = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({
    period: "quarter",
    division: "all",
  });
  const [savingMetricId, setSavingMetricId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MetricCategory>("lucratividade");
  
  // Month/Year selection state
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: metrics, isLoading: metricsLoading } = useMetrics(filters);
  const { data: historyData, isLoading: historyLoading } = useMetricHistory(undefined, filters);
  const { data: trainingHours, isLoading: trainingLoading } = useTrainingHours(filters);

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
      const date = parseISO(h.recorded_at);
      return h.metric_id === metricId && 
             date.getFullYear() === selectedYear && 
             date.getMonth() + 1 === selectedMonth;
    });
    return record?.id ?? null;
  }, [historyData, selectedMonth, selectedYear]);

  // Save/update monthly value mutation
  const saveMonthlyValue = useMutation({
    mutationFn: async ({ metricId, value }: { metricId: string; value: number }) => {
      if (selectedMonth === null) return;
      
      const recordedAt = format(new Date(selectedYear, selectedMonth - 1, 1), "yyyy-MM-dd");
      const existingId = getHistoryId(metricId);
      
      if (existingId) {
        const { error } = await supabase
          .from("metric_history")
          .update({ value })
          .eq("id", existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("metric_history")
          .insert({
            metric_id: metricId,
            value,
            recorded_at: recordedAt,
            period_type: "monthly",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metric_history"] });
      toast({
        title: "Valor salvo",
        description: "O lançamento foi atualizado com sucesso.",
      });
      setSavingMetricId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      setSavingMetricId(null);
    },
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
      const date = parseISO(h.recorded_at);
      if (date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth) {
        values[h.metric_id] = h.value;
      }
    });
    return values;
  }, [historyData, selectedMonth, selectedYear]);

  // Calculate accumulated values per metric for "Todo o Período" (selected year)
  const accumulatedValues = useMemo(() => {
    if (!historyData) return {};
    
    const values: Record<string, number> = {};
    historyData.forEach((h) => {
      const date = parseISO(h.recorded_at);
      if (date.getFullYear() === selectedYear) {
        values[h.metric_id] = (values[h.metric_id] || 0) + h.value;
      }
    });
    return values;
  }, [historyData, selectedYear]);

  // Create metrics with adjusted values based on selection
  const adjustedMetrics = useMemo(() => {
    if (!metrics) return [];
    
    return metrics.map((metric) => ({
      ...metric,
      current_value: selectedMonth === null 
        ? (accumulatedValues[metric.id] ?? 0)
        : metric.current_value,
    }));
  }, [metrics, selectedMonth, accumulatedValues]);

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
      const date = parseISO(h.recorded_at);
      return date.getFullYear() === selectedYear;
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
      description: `${pending.length} alteração(ões) sincronizada(s).`,
    });
    setIsSyncing(false);
  }, [isOnline, getPendingMutations, clearPendingMutations, queryClient]);

  if (metricsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardHeader />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="dashboard-grid">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-14">
      <PrintStyles />
      <AutoStartTour />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div data-tour="header">
          <DashboardHeader 
            metrics={adjustedMetrics}
            historyData={historyData}
            selectedYear={selectedYear}
            mobileDrawer={
              <div data-tour="mobile-menu">
                <MobileDrawer 
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  categoryMetricsCounts={categoryMetricsCounts}
                />
              </div>
            }
          />
        </div>
        
        {/* Data Entry Section */}
        {metrics && (
          <div data-tour="data-entry">
            <DataEntrySection 
              metrics={metrics} 
              trainingHours={trainingHours} 
            />
          </div>
        )}
        
        <div data-tour="filters">
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            onPrint={handlePrint}
          />
        </div>
        
        {/* Month Selector */}
        <div data-tour="month-selector">
          <MonthSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            historyData={historyData}
          />
        </div>
        
        {/* Months Summary */}
        {historyData && metrics && (
          <MonthsSummary
            historyData={historyData}
            selectedYear={selectedYear}
            metricsCount={metrics.length}
          />
        )}
        

        {/* Category Tabs with Swipe Support */}
        <SwipeableTabs<MetricCategory>
          tabs={categoryOrder}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MetricCategory)} className="mb-4 sm:mb-6">
            {/* Chrome-style tabs - full width */}
            <div data-tour="category-tabs" className="flex items-end bg-muted/30 rounded-t-xl pt-1 px-1 gap-0.5">
              {categoryOrder.map((category) => {
                const config = categoryConfig[category];
                const Icon = config.icon;
                const categoryMetricsCount = groupedMetrics[category]?.length || 0;
                const isActive = activeTab === category;
                
                return (
                  <button
                    key={category}
                    onClick={() => setActiveTab(category)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-t-lg transition-all relative",
                      "text-[9px] sm:text-xs font-medium",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm z-10" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="hidden md:inline truncate">{config.shortTitle}</span>
                    <span className={cn(
                      "text-[7px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full font-semibold",
                      isActive 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {categoryMetricsCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {categoryOrder.map((category) => {
              const config = categoryConfig[category];
              const categoryMetrics = groupedMetrics[category] || [];
              // Show all categories even without metrics
              
              const categoryHistory = historyByCategory?.[category];
              const organizedSubcategories = organizeMetricsBySubcategory(categoryMetrics, category);
              
              return (
                <TabsContent key={category} value={category} className="mt-0 bg-card border border-t-0 border-border/50 rounded-b-xl rounded-tr-xl p-3 sm:p-4 animate-fade-in">
                  <SectionHeader
                    title={config.title}
                    subtitle={config.subtitle}
                    icon={config.icon}
                    variant={config.variant}
                  />
                  
                  {/* Render subcategories */}
                  {organizedSubcategories.map((subcat) => {
                    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                    const selectedMonthName = selectedMonth ? monthNames[selectedMonth - 1] : undefined;
                    
                    return (
                      <div key={subcat.name} className="mb-4 sm:mb-6">
                        <SubcategoryHeader name={subcat.name} count={subcat.metrics.length} />
                        <div className="dashboard-grid">
                          {subcat.metrics.map((metric, metricIndex) => (
                            <div 
                              key={metric.id}
                              data-tour={metricIndex === 0 && category === "lucratividade" ? "metric-card" : undefined}
                            >
                              <MetricCardMonthly 
                                metric={metric} 
                                monthlyValue={monthlyValues[metric.id] ?? null}
                                isMonthSelected={selectedMonth !== null}
                                accumulatedValue={accumulatedValues[metric.id] ?? 0}
                                onSave={selectedMonth !== null ? handleSaveMonthlyValue : undefined}
                                isSaving={savingMetricId === metric.id}
                                selectedMonthName={selectedMonthName}
                                historyData={historyData}
                                selectedYear={selectedYear}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Chart for this category */}
                  {categoryHistory && categoryHistory.length > 0 && metrics && (
                    <MetricChart
                      data={categoryHistory}
                      metrics={metrics}
                      title={`Evolução - ${config.title} (${selectedYear})`}
                    />
                  )}

                  {/* Training Hours - only in aprendizado_crescimento tab */}
                  {category === "aprendizado_crescimento" && trainingHours && trainingHours.length > 0 && (
                    <div className="mt-4 sm:mt-6">
                      <SubcategoryHeader name="Horas de Treinamento" count={trainingHours.length} />
                      <div className="dashboard-grid">
                        <TrainingCardEditable items={trainingHours} />
                      </div>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </SwipeableTabs>
      </div>
      
      {/* Sync Status Footer */}
      <SyncStatusFooter
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSync={handleSync}
        lastSyncedAt={lastSyncedAt}
      />
    </div>
  );
};

export default Index;