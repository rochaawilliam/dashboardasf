import { useMemo } from "react";
import { cn } from "@/lib/utils";
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

export function MonthsSummary({ historyData, selectedYear, metricsCount }: MonthsSummaryProps) {
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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">
          Lançamentos {selectedYear}
        </span>
        <span className="text-sm">
          <span className="font-medium text-primary">{launchedCount}</span>
          <span className="text-muted-foreground">/{maxMonths}</span>
        </span>
      </div>
      
      <div className="flex gap-1">
        {monthNames.map((name, index) => {
          const month = index + 1;
          const isLaunched = monthsLaunched.has(month);
          const isFuture = selectedYear === currentYear && month > currentMonth;
          
          return (
            <div
              key={month}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-colors",
                isLaunched && "bg-primary",
                !isLaunched && !isFuture && "bg-muted",
                isFuture && "bg-muted/30"
              )}
              title={`${name}: ${isLaunched ? "Lançado" : isFuture ? "Futuro" : "Pendente"}`}
            />
          );
        })}
      </div>
    </div>
  );
}
