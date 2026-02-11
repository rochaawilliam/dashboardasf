import { useMemo, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CalendarCheck, CalendarX, ChevronDown, Target, TrendingUp } from "lucide-react";
import { parseISO } from "date-fns";
import type { MetricHistory, Metric, MonthlyTarget } from "@/hooks/useMetrics";
import { formatMetricValue } from "@/utils/formatters";

interface MonthsSummaryProps {
  historyData: MetricHistory[] | undefined;
  selectedYear: number;
  metricsCount: number;
  metrics?: Metric[];
  monthlyTargets?: MonthlyTarget[];
}

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const monthNamesFull = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const MonthsSummary = forwardRef<HTMLDivElement, MonthsSummaryProps>(
  function MonthsSummary({ historyData, selectedYear, metricsCount, metrics, monthlyTargets }, ref) {
    const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

    const monthsLaunched = useMemo(() => {
      if (!historyData) return new Set<number>();
      
      const launched = new Set<number>();
      historyData.forEach((h) => {
        const date = parseISO(h.recorded_at);
        if (date.getFullYear() === selectedYear) {
          launched.add(date.getMonth() + 1);
        }
      });
      return launched;
    }, [historyData, selectedYear]);

    // Get entries for expanded month
    const monthEntries = useMemo(() => {
      if (!historyData || !metrics || expandedMonth === null) return [];
      
      const entries: Array<{ metric: Metric; value: number }> = [];
      historyData.forEach((h) => {
        const date = parseISO(h.recorded_at);
        if (date.getFullYear() === selectedYear && date.getMonth() + 1 === expandedMonth) {
          const metric = metrics.find(m => m.id === h.metric_id);
          if (metric) {
            entries.push({ metric, value: h.value });
          }
        }
      });
      return entries.sort((a, b) => a.metric.name.localeCompare(b.metric.name, "pt-BR"));
    }, [historyData, metrics, expandedMonth, selectedYear]);

    // Get monthly targets for expanded month
    const monthTargets = useMemo(() => {
      if (!monthlyTargets || !metrics || expandedMonth === null) return [];
      
      return monthlyTargets
        .filter(mt => mt.month === expandedMonth)
        .map(mt => {
          const metric = metrics.find(m => m.id === mt.metric_id);
          return metric ? { metric, target: mt.target_value } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a!.metric.name.localeCompare(b!.metric.name, "pt-BR")) as Array<{ metric: Metric; target: number }>;
    }, [monthlyTargets, metrics, expandedMonth]);

    // Build a combined view: all metrics with targets for this month, plus their actual values
    const combinedMonthData = useMemo(() => {
      if (!metrics || expandedMonth === null) return [];

      const entryMap = new Map(monthEntries.map(e => [e.metric.id, e.value]));
      const targetMap = new Map(monthTargets.map(t => [t.metric.id, t.target]));

      // Get all metrics that have either an entry or a target for this month
      const relevantMetricIds = new Set([
        ...entryMap.keys(),
        ...targetMap.keys(),
      ]);

      // If no specific targets, show all metrics with their annual target / 12
      if (relevantMetricIds.size === 0 && metrics.length > 0) {
        return metrics
          .map(m => ({
            metric: m,
            value: null as number | null,
            target: m.target_value / 12,
            hasSpecificTarget: false,
          }))
          .sort((a, b) => a.metric.name.localeCompare(b.metric.name, "pt-BR"));
      }

      // Show all metrics, prioritizing those with data
      return metrics
        .map(m => ({
          metric: m,
          value: entryMap.get(m.id) ?? null,
          target: targetMap.get(m.id) ?? m.target_value / 12,
          hasSpecificTarget: targetMap.has(m.id),
        }))
        .sort((a, b) => {
          // Metrics with entries first, then by name
          const aHas = a.value !== null ? 0 : 1;
          const bHas = b.value !== null ? 0 : 1;
          if (aHas !== bHas) return aHas - bHas;
          return a.metric.name.localeCompare(b.metric.name, "pt-BR");
        });
    }, [metrics, expandedMonth, monthEntries, monthTargets]);

    const launchedCount = monthsLaunched.size;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const maxMonths = selectedYear === currentYear ? currentMonth : 12;

    const handleMonthClick = (month: number) => {
      setExpandedMonth(prev => prev === month ? null : month);
    };

    const getProgressColor = (value: number | null, target: number) => {
      if (value === null) return "text-muted-foreground";
      const pct = target > 0 ? (value / target) * 100 : 0;
      if (pct > 95) return "text-success";
      if (pct > 70) return "text-accent";
      if (pct > 50) return "text-primary";
      if (pct > 35) return "text-warning";
      return "text-destructive";
    };

    return (
      <div ref={ref} className="mb-6 p-4 rounded-lg bg-card border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Resumo de Lançamentos - {selectedYear}</h3>
          </div>
          <div className="text-sm">
            <span className={cn(
              "font-semibold",
              launchedCount === maxMonths ? "text-success" : "text-warning"
            )}>
              {launchedCount}
            </span>
            <span className="text-muted-foreground"> / {maxMonths} meses</span>
          </div>
        </div>
        
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {monthNames.map((name, index) => {
            const month = index + 1;
            const isLaunched = monthsLaunched.has(month);
            const isFuture = selectedYear === currentYear && month > currentMonth;
            const isPast = selectedYear < currentYear || (selectedYear === currentYear && month <= currentMonth);
            const isExpanded = expandedMonth === month;
            
            return (
              <button
                key={month}
                onClick={() => handleMonthClick(month)}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-md text-xs transition-all cursor-pointer",
                  "hover:ring-2 hover:ring-primary/40 hover:scale-105",
                  isExpanded && "ring-2 ring-primary scale-105 shadow-md",
                  isLaunched && !isExpanded && "bg-success/20 text-success border border-success/30",
                  !isLaunched && isPast && !isExpanded && "bg-destructive/10 text-destructive border border-destructive/20",
                  isFuture && !isExpanded && "bg-muted text-muted-foreground border border-border",
                  isExpanded && "bg-primary text-primary-foreground border border-primary"
                )}
              >
                <span className="font-medium">{name}</span>
                {isLaunched ? (
                  <CalendarCheck className="h-3.5 w-3.5 mt-1" />
                ) : !isFuture || isExpanded ? (
                  <CalendarX className="h-3.5 w-3.5 mt-1" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Expanded month detail panel */}
        {expandedMonth !== null && metrics && (
          <div className="mt-4 pt-4 border-t border-border animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {monthNamesFull[expandedMonth - 1]} {selectedYear} — Metas e Lançamentos
              </h4>
              <span className="text-xs text-muted-foreground">
                {monthEntries.length} lançamento(s) de {metrics.length} métricas
              </span>
            </div>

            {combinedMonthData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma métrica cadastrada.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Métrica</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Meta Mensal</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Realizado</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedMonthData.map(({ metric, value, target, hasSpecificTarget }) => {
                      const pct = value !== null && target > 0 ? (value / target) * 100 : null;
                      return (
                        <tr key={metric.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-2 font-medium text-foreground max-w-[200px] truncate" title={metric.name}>
                            {metric.name}
                          </td>
                          <td className="py-2 px-2 text-right text-muted-foreground whitespace-nowrap">
                            {formatMetricValue(target, metric.unit)}
                            {!hasSpecificTarget && (
                              <span className="text-[9px] ml-1 opacity-50" title="Meta anual dividida por 12">≈</span>
                            )}
                          </td>
                          <td className={cn(
                            "py-2 px-2 text-right font-medium whitespace-nowrap",
                            value !== null ? getProgressColor(value, target) : "text-muted-foreground/50"
                          )}>
                            {value !== null ? formatMetricValue(value, metric.unit) : "—"}
                          </td>
                          <td className={cn(
                            "py-2 px-2 text-right font-semibold whitespace-nowrap",
                            pct !== null ? getProgressColor(value, target) : "text-muted-foreground/50"
                          )}>
                            {pct !== null ? `${pct.toFixed(0)}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-success/20 border border-success/30" />
            <span>Com lançamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive/20" />
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted border border-border" />
            <span>Futuro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">💡 Clique no mês para detalhes</span>
          </div>
        </div>
      </div>
    );
  }
);
