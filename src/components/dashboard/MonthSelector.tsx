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
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

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
    <div className="mb-2 sm:mb-4 p-1.5 sm:p-3 bg-card rounded-lg border border-border print:hidden">
      {/* Year + month selector */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
        
        {/* Year navigation */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6" onClick={() => onYearChange(selectedYear - 1)}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-[10px] sm:text-xs font-semibold w-8 text-center">{selectedYear}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6" onClick={() => onYearChange(selectedYear + 1)}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* All Year + Month buttons - scrollable on mobile */}
        <ScrollArea className="flex-1">
          <div className="flex gap-0.5 sm:gap-1">
            <Button
              variant={selectedMonth === null ? "default" : "outline"}
              size="sm"
              onClick={() => onMonthChange(null)}
              className={cn(
                "h-6 sm:h-7 text-[7px] sm:text-[10px] px-1.5 sm:px-2 shrink-0",
                selectedMonth === null && "bg-primary text-primary-foreground"
              )}
            >
              Ano
            </Button>
            
            {months.map((month) => {
              const hasData = monthsWithData.has(month.value);
              const isSelected = selectedMonth === month.value;
              const isFuture = selectedYear === currentYear && month.value > currentMonth;
              const isPast = selectedYear < currentYear || (selectedYear === currentYear && month.value <= currentMonth);
              
              return (
                <Button
                  key={month.value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onMonthChange(month.value)}
                  className={cn(
                    "h-6 sm:h-7 text-[7px] sm:text-[10px] px-1 sm:px-1.5 shrink-0",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && hasData && "border-success/50 bg-success/10 text-success hover:bg-success/20 hover:text-success",
                    !isSelected && !hasData && isPast && "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
                    !isSelected && !hasData && isFuture && "border-border text-muted-foreground"
                  )}
                >
                  {month.label}
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </div>
      
      {/* Legend - compact */}
      <div className="flex flex-wrap gap-2 sm:gap-3 text-[7px] sm:text-[10px] text-muted-foreground mt-1">
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded border border-success/50 bg-success/10" />
          <span>Com lançamento</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded border border-destructive/30 bg-destructive/10" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded border border-border bg-transparent" />
          <span>Futuro</span>
        </div>
      </div>
    </div>
  );
}
