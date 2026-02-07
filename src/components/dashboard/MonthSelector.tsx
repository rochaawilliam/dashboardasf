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
      {/* Year navigation + All Year + Months - full width grid */}
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Período</span>
        </div>
        
        {/* Year navigation */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onYearChange(selectedYear - 1)}
            disabled={selectedYear <= years[0]}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-xs font-semibold w-10 text-center">{selectedYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onYearChange(selectedYear + 1)}
            disabled={selectedYear >= years[years.length - 1]}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* All Year + Month buttons - full width */}
      <div className="grid grid-cols-13 gap-1">
        {/* All year button */}
        <Button
          variant={selectedMonth === null ? "default" : "outline"}
          size="sm"
          onClick={() => onMonthChange(null)}
          className={cn(
            "h-7 text-[9px] sm:text-[10px] px-1",
            selectedMonth === null && "bg-primary text-primary-foreground"
          )}
        >
          Ano
        </Button>
        
        {/* Month buttons */}
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
                "h-7 text-[9px] sm:text-[10px] px-1",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && hasData && "border-success/50 bg-success/10 text-success hover:bg-success/20 hover:text-success",
                !isSelected && !hasData && "border-border"
              )}
            >
              {month.label}
            </Button>
          );
        })}
      </div>
      
      {/* Legend - compact */}
      <div className="flex flex-wrap gap-2 sm:gap-4 text-[9px] sm:text-[11px] text-muted-foreground mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded border border-success/50 bg-success/10" />
          <span>Com lançamentos</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded border border-border bg-transparent" />
          <span>Sem lançamentos</span>
        </div>
      </div>
    </div>
  );
}
