import React from "react";
import { cn } from "@/lib/utils";
import { formatMetricValue } from "@/utils/formatters";
import { ArrowDown, Globe, Building2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  /** stage conversion rules keyed by metric name: converts from another stage with a target % */
  conversionRules?: Record<string, { from: string; target: number }>;
  /** extra content rendered inside a card, keyed by metric id */
  cardExtras?: Record<string, React.ReactNode>;
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
  conversionRules,
  cardExtras,
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

  const valueOf = (m?: Metric) => {
    if (!m) return null;
    const v = selectedMonth !== null ? monthlyValues[m.id] : accumulatedValues[m.id];
    return v == null ? null : Number(v);
  };

  const byName: Record<string, Metric> = {};
  metrics.forEach((m: any) => {
    if (!m.__placeholder) byName[m.name] = m;
  });

  const conversionFor = (metric: Metric) => {
    const rule = conversionRules?.[metric.name];
    if (!rule) return null;
    const fromMetric = byName[rule.from];
    const fromValue = valueOf(fromMetric);
    const toValue = valueOf(metric);
    const rate = fromValue && fromValue > 0 ? ((toValue ?? 0) / fromValue) * 100 : null;
    return {
      rate,
      target: rule.target,
      from: cleanName(rule.from),
      to: cleanName(metric.name),
      fromValue,
      toValue,
    };
  };


  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      {/* Funnel Header */}
      <div className={cn(
        "flex items-center gap-2 px-2.5 sm:px-4 py-2 sm:py-3 bg-gradient-to-r border-b",
        headerColors
      )}>
        <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", iconColors)} />
        <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate">{title}</h3>
        <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto shrink-0">{metrics.filter((m: any) => !m.__placeholder).length} etapas</span>
      </div>

      {/* Funnel Steps */}
      <div className={cn("p-2 sm:p-3 space-y-1", bodyColors)}>

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
          const conv = isPlaceholder ? null : conversionFor(metric);
          const extra = cardExtras?.[metric.id];

          return (
            <React.Fragment key={metric.id}>
              {index > 0 && (
                <div className={cn(
                  "flex justify-center py-0.5",
                  (isPlaceholder || prevPlaceholder) && "invisible hidden lg:flex"
                )}>
                  <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
              <div className={cn(isPlaceholder && "invisible pointer-events-none hidden lg:block")} aria-hidden={isPlaceholder}>

                <CircularProgressCard
                  metric={{ ...metric, name: cleanName(metric.name) }}
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
                  sideContent={
                    (extra || conv) ? (
                      <div className="space-y-1.5">
                        {extra}
                        {conv && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="cursor-help space-y-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground leading-tight flex items-center gap-1">
                                  <span className="truncate">Conversão</span>
                                  <Info className="h-2.5 w-2.5 shrink-0 opacity-70" />
                                </p>
                                <div>
                                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">Meta</p>
                                  <p className="text-sm sm:text-lg font-semibold text-foreground leading-none tracking-tighter">
                                    {conv.target}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">Realizado</p>
                                  <p className={cn(
                                    "text-base sm:text-xl font-extrabold leading-none tracking-tighter",
                                    conv.rate == null
                                      ? "text-muted-foreground"
                                      : conv.rate >= conv.target
                                      ? "text-success"
                                      : conv.rate >= conv.target * 0.85
                                      ? "text-warning"
                                      : "text-destructive"
                                  )}>
                                    {conv.rate == null ? "—" : `${formatMetricValue(Math.round(conv.rate), "%", "")}`}
                                  </p>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs max-w-[280px]">
                              <p className="font-semibold mb-1">Conversão {conv.from} → {conv.to}</p>
                              <p className="text-popover-foreground/80">
                                Fórmula: {conv.to} ÷ {conv.from} × 100
                              </p>
                              <p className="text-popover-foreground/80">
                                Cálculo: {conv.toValue == null ? "—" : formatMetricValue(conv.toValue, "", "")} ÷ {conv.fromValue == null ? "—" : formatMetricValue(conv.fromValue, "", "")} ={" "}
                                {conv.rate == null ? "—" : `${Math.round(conv.rate)}%`}
                              </p>
                              <p className="text-popover-foreground/80 mt-1">
                                Meta da etapa: {conv.target}%
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ) : undefined
                  }

                />

              </div>

            </React.Fragment>
          );
        })}
      </div>

    </div>
  );
}
