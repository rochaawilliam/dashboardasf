import { useMemo, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { CalendarCheck, CalendarX } from "lucide-react";
import { getRefMonthYear } from "@/utils/dateUtils";
import type { MetricHistory } from "@/hooks/useMetrics";

interface MonthsSummaryProps {
  historyData: MetricHistory[] | undefined;
  selectedYear: number;
  metricsCount: number;
  selectedMonth: number | null;
  onMonthChange: (month: number | null) => void;
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
  function MonthsSummary({ historyData, selectedYear, metricsCount, selectedMonth, onMonthChange }, ref) {
    const monthsLaunched = useMemo(() => {
      if (!historyData) return new Set<number>();
      const launched = new Set<number>();
      historyData.forEach((h) => {
        const ref = getRefMonthYear(h.period_type, h.recorded_at);
        if (ref.year === selectedYear) {
          launched.add(ref.month);
        }
      });
      return launched;
    }, [historyData, selectedYear]);

    const launchedCount = monthsLaunched.size;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const maxMonths = selectedYear === currentYear ? currentMonth : 12;

    const handleMonthClick = (month: number) => {
      onMonthChange(selectedMonth === month ? null : month);
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
            const isSelected = selectedMonth === month;
            
            return (
              <button
                key={month}
                onClick={() => handleMonthClick(month)}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-md text-xs transition-all cursor-pointer",
                  "hover:ring-2 hover:ring-primary/40 hover:scale-105",
                  isSelected && "ring-2 ring-primary scale-105 shadow-md bg-primary text-primary-foreground border border-primary",
                  isLaunched && !isSelected && "bg-success/20 text-success border border-success/30",
                  !isLaunched && isPast && !isSelected && "bg-destructive/10 text-destructive border border-destructive/20",
                  isFuture && !isSelected && "bg-muted text-muted-foreground border border-border",
                )}
              >
                <span className="font-medium">{name}</span>
                {isLaunched ? (
                  <CalendarCheck className="h-3.5 w-3.5 mt-1" />
                ) : !isFuture || isSelected ? (
                  <CalendarX className="h-3.5 w-3.5 mt-1" />
                ) : null}
              </button>
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
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">💡 Clique no mês para alterar os cards</span>
          </div>
        </div>
      </div>
    );
  }
);
