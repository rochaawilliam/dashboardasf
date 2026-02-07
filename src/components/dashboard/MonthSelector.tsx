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
    <div className="mb-6 flex items-center gap-3">
      {/* Year navigation */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onYearChange(selectedYear - 1)}
          disabled={selectedYear <= years[0]}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold w-12 text-center">{selectedYear}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onYearChange(selectedYear + 1)}
          disabled={selectedYear >= years[years.length - 1]}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* All Year + Month buttons */}
      <div className="flex-1 flex gap-1 overflow-x-auto">
        <Button
          variant={selectedMonth === null ? "default" : "ghost"}
          size="sm"
          onClick={() => onMonthChange(null)}
          className={cn(
            "h-8 px-3 rounded-lg text-xs font-medium shrink-0",
            selectedMonth === null && "bg-primary text-primary-foreground"
          )}
        >
          Ano
        </Button>
        
        {months.map((month) => {
          const hasData = monthsWithData.has(month.value);
          const isSelected = selectedMonth === month.value;
          
          return (
            <Button
              key={month.value}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              onClick={() => onMonthChange(month.value)}
              className={cn(
                "h-8 px-2 rounded-lg text-xs font-medium shrink-0",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && hasData && "text-primary",
                !isSelected && !hasData && "text-muted-foreground"
              )}
            >
              {month.label}
              {hasData && !isSelected && <span className="ml-0.5 w-1 h-1 rounded-full bg-primary inline-block" />}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
