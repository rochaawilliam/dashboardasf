import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarDays, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { parseISO } from "date-fns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { MetricHistory } from "@/hooks/useMetrics";

interface MonthSelectorProps {
  selectedMonth: number | null;
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
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-card rounded-xl border border-border print:hidden">
      {/* Single row with Year, Ano Todo button, and Month buttons */}
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-muted-foreground shrink-0">
          <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          <span className="hidden sm:inline">Período</span>
        </div>
        
        {/* Year navigation */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-muted/50 rounded-lg p-0.5 sm:p-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7"
            onClick={() => onYearChange(selectedYear - 1)}
            disabled={selectedYear <= years[0]}
          >
            <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
          <span className="text-xs sm:text-sm font-semibold w-10 sm:w-12 text-center">{selectedYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7"
            onClick={() => onYearChange(selectedYear + 1)}
            disabled={selectedYear >= years[years.length - 1]}
          >
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
        
        {/* Period button - All year */}
        <Button
          variant={selectedMonth === null ? "default" : "outline"}
          size="sm"
          onClick={() => onMonthChange(null)}
          className={cn(
            "h-6 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs whitespace-nowrap shrink-0",
            selectedMonth === null && "bg-primary text-primary-foreground"
          )}
        >
          Ano Todo
        </Button>
        
        {/* Month selector - inline, scrollable on mobile */}
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-0.5 sm:gap-1">
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
                    "h-6 sm:h-7 px-1.5 sm:px-2 min-w-[32px] sm:min-w-[38px] text-[9px] sm:text-[11px] flex-shrink-0",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && hasData && "border-success/50 bg-success/10 text-success hover:bg-success/20 hover:text-success",
                    !isSelected && !hasData && "border-border"
                  )}
                >
                  {month.label}
                  {hasData && !isSelected && (
                    <Check className="h-2 w-2 ml-0.5" />
                  )}
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </div>
      
      {/* Legend - compact */}
      <div className="flex flex-wrap gap-2 sm:gap-4 text-[9px] sm:text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded border border-success/50 bg-success/10" />
          <span>Com lançamentos</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded border border-border bg-transparent" />
          <span>Sem lançamentos</span>
        </div>
      </div>
    </div>
  );
}
