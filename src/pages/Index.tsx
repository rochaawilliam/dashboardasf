import { useState, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SummaryCardsLive } from "@/components/dashboard/SummaryCardsLive";
import { MetricCardEditable } from "@/components/dashboard/MetricCardEditable";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { TrainingCardEditable } from "@/components/dashboard/TrainingCardEditable";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { AlertsSummary } from "@/components/dashboard/AlertsSummary";
import { MetricChart } from "@/components/dashboard/MetricChart";
import { PrintStyles } from "@/components/dashboard/PrintStyles";
import { DataEntryModal } from "@/components/dashboard/DataEntryModal";
import { BulkDataEntry } from "@/components/dashboard/BulkDataEntry";
import { Skeleton } from "@/components/ui/skeleton";
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

const categoryConfig: Record<MetricCategory, { title: string; subtitle: string; icon: any; variant: "primary" | "accent" | "success" | "warning" }> = {
  lucratividade: {
    title: "Lucratividade",
    subtitle: "Aumentar lucratividade e margem do negócio",
    icon: DollarSign,
    variant: "primary",
  },
  experiencia_cliente: {
    title: "Experiência do Cliente",
    subtitle: "Entregar experiência consistente e previsível",
    icon: Heart,
    variant: "accent",
  },
  produtividade: {
    title: "Produtividade",
    subtitle: "Garantir eficiência do time jurídico",
    icon: Zap,
    variant: "warning",
  },
  gestao_pessoas: {
    title: "Gestão de Pessoas",
    subtitle: "Construir um time estável, produtivo e engajado",
    icon: Users,
    variant: "success",
  },
  aprendizado_crescimento: {
    title: "Aprendizado e Crescimento",
    subtitle: "Desenvolver competências técnicas e lideranças internas",
    icon: GraduationCap,
    variant: "primary",
  },
};

const Index = () => {
  const [filters, setFilters] = useState<Filters>({
    period: "quarter",
    division: "all",
  });

  const { data: metrics, isLoading: metricsLoading } = useMetrics(filters);
  const { data: historyData, isLoading: historyLoading } = useMetricHistory(undefined, filters);
  const { data: trainingHours, isLoading: trainingLoading } = useTrainingHours(filters);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Group metrics by category
  const groupedMetrics = metrics?.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<MetricCategory, typeof metrics>);

  // Group history by category for charts
  const historyByCategory = historyData?.reduce((acc, item) => {
    const metric = metrics?.find((m) => m.id === item.metric_id);
    if (metric) {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(item);
    }
    return acc;
  }, {} as Record<MetricCategory, typeof historyData>);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader />
        
        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
          {metrics && <DataEntryModal metrics={metrics} />}
          {metrics && trainingHours && (
            <BulkDataEntry metrics={metrics} trainingHours={trainingHours} />
          )}
        </div>
        
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onPrint={handlePrint}
        />
        
        {metrics && <AlertsSummary metrics={metrics} />}
        
        {metrics && <SummaryCardsLive metrics={metrics} />}

        {/* Render each category */}
        {groupedMetrics && Object.entries(groupedMetrics).map(([category, categoryMetrics]) => {
          const config = categoryConfig[category as MetricCategory];
          if (!config || !categoryMetrics) return null;
          
          const categoryHistory = historyByCategory?.[category as MetricCategory];
          
          return (
            <section key={category} className="mb-8 print:break-inside-avoid">
              <SectionHeader
                title={config.title}
                subtitle={config.subtitle}
                icon={config.icon}
                variant={config.variant}
              />
              
              <div className="dashboard-grid mb-6">
                {categoryMetrics.map((metric) => (
                  <MetricCardEditable key={metric.id} metric={metric} />
                ))}
              </div>
              
              {/* Chart for this category */}
              {categoryHistory && categoryHistory.length > 0 && metrics && (
                <MetricChart
                  data={categoryHistory}
                  metrics={metrics}
                  title={`Evolução - ${config.title}`}
                />
              )}
            </section>
          );
        })}

        {/* Training Hours */}
        {trainingHours && trainingHours.length > 0 && (
          <section className="mb-8 print:break-inside-avoid">
            <SectionHeader
              title="Aprendizado e Crescimento"
              subtitle="Desenvolver competências técnicas e lideranças internas"
              icon={GraduationCap}
              variant="primary"
            />
            <div className="dashboard-grid">
              <TrainingCardEditable items={trainingHours} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Index;
