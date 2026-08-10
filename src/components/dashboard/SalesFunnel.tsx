import React from "react";
import { cn } from "@/lib/utils";
import { formatMetricValue } from "@/utils/formatters";
import { ArrowDown, Globe, Building2 } from "lucide-react";
import type { Metric, MetricHistory, MonthlyTarget } from "@/hooks/useMetrics";
import { CircularProgressCard } from "./CircularProgressCard";

interface SalesFunnelProps {
  title: string;
  icon: React.ElementType;
  metrics: Metric[];
  monthlyValues: Record<string, number>;
  accumulatedValues: Record<string, number>;
  selectedMonth: number | null;
  selectedYear: number;
  historyData?: MetricHistory[];
  monthlyTargets?: MonthlyTarget[];
  onCardClick?: (metric: Metric) => void;
  colorScheme: "blue" | "amber" | "emerald";
  pipelineMetricIds?: Set<string>;
  pipelineCardNames?: Record<string, string[]>;
}

export function SalesFunnel({
  title,
  icon: Icon,
  metrics,
  monthlyValues,
  accumulatedValues,
  selectedMonth,
  selectedYear,
  historyData,
  monthlyTargets,
  onCardClick,
  colorScheme,
  pipelineMetricIds,
  pipelineCardNames,
}: SalesFunnelProps) {
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const selectedMonthName = selectedMonth ? monthNames[selectedMonth - 1] : undefined;

  const headerColors = colorScheme === "blue"
    ? "from-blue-500/20 to-blue-600/10 border-blue-500/30"
    : colorScheme === "amber"
    ? "from-amber-500/20 to-amber-600/10 border-amber-500/30"
    : "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30";

  const iconColors = colorScheme === "blue"
    ? "text-blue-400"
    : colorScheme === "amber"
    ? "text-amber-400"
    : "text-emerald-400";

  const bodyColors = colorScheme === "blue"
    ? "bg-blue-500/[0.07]"
    : colorScheme === "amber"
    ? "bg-amber-500/[0.07]"
    : "bg-emerald-500/[0.07]";

  const cleanName = (name: string) =>
    name.replace(/\s*\bASF\b\s*/g, " ").replace(/\s{2,}/g, " ").trim();

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      {/* Funnel Header */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-3 bg-gradient-to-r border-b",
        headerColors
      )}>
        <Icon className={cn("h-5 w-5", iconColors)} />
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground ml-auto">{metrics.filter((m: any) => !m.__placeholder).length} etapas</span>
      </div>

      {/* Funnel Steps */}
      <div className="p-3 space-y-1">
        {metrics.map((metric, index) => {
          const isPlaceholder = (metric as any).__placeholder === true;
          const prevPlaceholder = index > 0 && (metrics[index - 1] as any).__placeholder === true;
          const monthlyValue = monthlyValues[metric.id] ?? null;
          const accumulated = accumulatedValues[metric.id] ?? 0;
          const monthlyTarget = selectedMonth && monthlyTargets
            ? monthlyTargets.find(
                (t) => t.metric_id === metric.id && t.month === selectedMonth && t.year === selectedYear
              )?.target_value ?? null
            : null;

          return (
            <React.Fragment key={metric.id}>
              {index > 0 && (
                <div className={cn("flex justify-center py-0.5", (isPlaceholder || prevPlaceholder) && "invisible")}>
                  <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
              <div className={cn(isPlaceholder && "invisible pointer-events-none")} aria-hidden={isPlaceholder}>
                <CircularProgressCard
                  metric={metric}
                  monthlyValue={monthlyValue}
                  isMonthSelected={selectedMonth !== null}
                  accumulatedValue={accumulated}
                  selectedMonthName={selectedMonthName}
                  historyData={historyData}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  monthlyTargets={monthlyTargets}
                  monthlyTargetOverride={monthlyTarget}
                  onCardClick={
                    isPlaceholder || pipelineMetricIds?.has(metric.id)
                      ? undefined
                      : onCardClick ? () => onCardClick(metric) : undefined
                  }
                  pipelineCardNames={pipelineCardNames?.[metric.id]}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>

    </div>
  );
}
