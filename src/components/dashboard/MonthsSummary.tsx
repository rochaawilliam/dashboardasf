import { useMemo, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { CalendarCheck, CalendarX } from "lucide-react";
import type { MetricHistory } from "@/hooks/useMetrics";
import { parseISO } from "date-fns";

interface MonthsSummaryProps {
  historyData: MetricHistory[] | undefined;
  selectedYear: number;
  metricsCount: number;
}

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export const MonthsSummary = forwardRef<HTMLDivElement, MonthsSummaryProps>(
  function MonthsSummary({ historyData, selectedYear, metricsCount }, ref) {
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

    const launchedCount = monthsLaunched.size;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const maxMonths = selectedYear === currentYear ? currentMonth : 12;

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
            
            return (
              <div
                key={month}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-md text-xs transition-colors",
                  isLaunched && "bg-success/20 text-success border border-success/30",
                  !isLaunched && isPast && "bg-destructive/10 text-destructive border border-destructive/20",
                  isFuture && "bg-muted text-muted-foreground border border-border"
                )}
              >
                <span className="font-medium">{name}</span>
                {isLaunched ? (
                  <CalendarCheck className="h-3.5 w-3.5 mt-1" />
                ) : !isFuture ? (
                  <CalendarX className="h-3.5 w-3.5 mt-1" />
                ) : null}
              </div>
            );
          })}
        </div>
        
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
        </div>
      </div>
    );
  }
);
