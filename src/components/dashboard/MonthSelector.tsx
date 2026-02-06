import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarDays, Check } from "lucide-react";
import { parseISO } from "date-fns";
import type { MetricHistory } from "@/hooks/useMetrics";

interface MonthSelectorProps {
  selectedMonth: number | null; // null = "Todo o Período"
  selectedYear: number;
  onMonthChange: (month: number | null) => void;
  onYearChange: (year: number) => void;
  historyData?: MetricHistory[];
}

const months = [
  { value: 1, label: "Jan", fullLabel: "Janeiro" },
  { value: 2, label: "Fev", fullLabel: "Fevereiro" },
  { value: 3, label: "Mar", fullLabel: "Março" },
  { value: 4, label: "Abr", fullLabel: "Abril" },
  { value: 5, label: "Mai", fullLabel: "Maio" },
  { value: 6, label: "Jun", fullLabel: "Junho" },
  { value: 7, label: "Jul", fullLabel: "Julho" },
  { value: 8, label: "Ago", fullLabel: "Agosto" },
  { value: 9, label: "Set", fullLabel: "Setembro" },
  { value: 10, label: "Out", fullLabel: "Outubro" },
  { value: 11, label: "Nov", fullLabel: "Novembro" },
  { value: 12, label: "Dez", fullLabel: "Dezembro" },
];

export function MonthSelector({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onYearChange,
  historyData
}: MonthSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Calculate which months have data
  const monthsWithData = useMemo(() => {
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

  return (
    <div className="mb-6 space-y-3">
      {/* Year and Month selector in same row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Year selector */}
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ano:</span>
          {years.map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              size="sm"
              onClick={() => onYearChange(year)}
              className="h-8 px-3"
            >
              {year}
            </Button>
          ))}
        </div>
        
        <div className="h-6 w-px bg-border" />

        {/* Period selector */}
        <Button
          variant={selectedMonth === null ? "default" : "outline"}
          size="sm"
          onClick={() => onMonthChange(null)}
          className={cn(
            "h-8 px-3",
            selectedMonth === null && "bg-primary text-primary-foreground"
          )}
        >
          Todo o Período
        </Button>
        
        <div className="h-6 w-px bg-border" />
        
        {/* Month buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {months.map((month) => {
            const hasData = monthsWithData.has(month.value);
            const isSelected = selectedMonth === month.value;
            
            return (
              <Button
                key={month.value}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onMonthChange(month.value)}
                className={cn(
                  "h-8 px-2 min-w-[42px] text-xs",
                  isSelected && "bg-primary text-primary-foreground",
                  !isSelected && hasData && "border-success/50 bg-success/10 text-success hover:bg-success/20 hover:text-success",
                  !isSelected && !hasData && "border-border"
                )}
              >
                {month.label}
                {hasData && !isSelected && (
                  <Check className="h-2.5 w-2.5 ml-0.5" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-success/50 bg-success/10" />
          <span>Com lançamentos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-border bg-transparent" />
          <span>Sem lançamentos</span>
        </div>
      </div>
    </div>
  );
}
