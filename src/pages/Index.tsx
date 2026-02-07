import { useState, useCallback, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { organizeMetricsBySubcategory } from "@/utils/metricOrganizer";
import { 
  DollarSign, 
  Heart, 
  Users, 
  Zap, 
  GraduationCap,
} from "lucide-react";
import {
  useMetrics,
  useMetricHistory,
  useTrainingHours,
  type Filters,
  type MetricCategory,
} from "@/hooks/useMetrics";
import { useMetricNotifications } from "@/hooks/useMetricNotifications";
import { Rocket } from "lucide-react";

const categoryConfig: Record<MetricCategory, { title: string; shortTitle: string; subtitle: string; icon: any; variant: "primary" | "accent" | "success" | "warning" }> = {
  lucratividade: {
    title: "Lucratividade",
    shortTitle: "Lucro",
    subtitle: "Aumentar lucratividade e margem do negócio",
    icon: DollarSign,
    variant: "primary",
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
        : metric.current_value, // will use monthlyValues in the card
    }));
  }, [metrics, selectedMonth, accumulatedValues]);

  // Group metrics by category
  const groupedMetrics = adjustedMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<MetricCategory, typeof adjustedMetrics>);

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
    <div className="min-h-screen bg-background">
      <PrintStyles />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <DashboardHeader 
          metrics={adjustedMetrics}
          historyData={historyData}
          selectedYear={selectedYear}
        />
        
        {/* Data Entry Section */}
        {metrics && (
          <DataEntrySection 
            metrics={metrics} 
            trainingHours={trainingHours} 
          />
        )}
        
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onPrint={handlePrint}
        />
        
        {/* Month Selector */}
        <MonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          historyData={historyData}
        />
        
        {/* Months Summary */}
        {historyData && metrics && (
          <MonthsSummary
            historyData={historyData}
            selectedYear={selectedYear}
            metricsCount={metrics.length}
          />
        )}
        

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MetricCategory)} className="mb-4 sm:mb-6">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1 sm:p-1.5 bg-muted/40 rounded-lg sm:rounded-xl gap-0.5 sm:gap-1">
            {categoryOrder.map((category) => {
              const config = categoryConfig[category];
              const Icon = config.icon;
              const categoryMetricsCount = groupedMetrics[category]?.length || 0;
              
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex flex-col items-center gap-0.5 sm:gap-1 py-2 sm:py-3 px-1 sm:px-2 rounded-md sm:rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-[9px] sm:text-xs font-medium text-center leading-tight hidden xs:block sm:block">
                    {config.shortTitle}
                  </span>
                  <span className="text-[8px] sm:text-[10px] bg-muted/70 px-1 sm:px-1.5 py-0.5 rounded-full font-medium">
                    {categoryMetricsCount}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categoryOrder.map((category) => {
            const config = categoryConfig[category];
            const categoryMetrics = groupedMetrics[category];
            if (!categoryMetrics) return null;
            
            const categoryHistory = historyByCategory?.[category];
            const organizedSubcategories = organizeMetricsBySubcategory(categoryMetrics, category);
            
            return (
              <TabsContent key={category} value={category} className="mt-6">
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
                    <div key={subcat.name} className="mb-6">
                      <SubcategoryHeader name={subcat.name} count={subcat.metrics.length} />
                      <div className="dashboard-grid">
                        {subcat.metrics.map((metric) => (
                          <MetricCardMonthly 
                            key={metric.id} 
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
                  <div className="mt-6">
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
      </div>
    </div>
  );
};

export default Index;
