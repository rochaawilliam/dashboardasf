import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRefMonthYear } from "@/utils/dateUtils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // kept for potential future use
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

  const monthsWithData = useMemo(() => {
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

  // Mobile: year nav + month select dropdown
  if (isMobile) {
    return (
      <div className="mb-2 p-1.5 bg-card rounded-lg border border-border print:hidden" lang="pt-BR" translate="no" role="group" aria-label="Filtro de período">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
          
          {/* Year navigation */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-5 w-5" aria-label={`Ano anterior (${selectedYear - 1})`} onClick={() => onYearChange(selectedYear - 1)}>
              <ChevronLeft className="h-3 w-3" aria-hidden="true" />
            </Button>
            <span className="text-[10px] font-semibold w-8 text-center" aria-live="polite">{selectedYear}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" aria-label={`Próximo ano (${selectedYear + 1})`} onClick={() => onYearChange(selectedYear + 1)}>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>

          {/* Month dropdown */}
          <Select
            value={selectedMonth === null ? "all" : String(selectedMonth)}
            onValueChange={(v) => onMonthChange(v === "all" ? null : Number(v))}
          >
            <SelectTrigger className="flex-1 h-7 text-[10px] bg-background" aria-label="Selecionar mês">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>

            <SelectContent className="bg-card border border-border z-50">
              <SelectItem value="all">Todo o Ano</SelectItem>
              {months.map((month) => {
                const hasData = monthsWithData.has(month.value);
                const isFuture = selectedYear === currentYear && month.value > currentMonth;
                return (
                  <SelectItem key={month.value} value={String(month.value)}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        hasData ? "bg-success" : isFuture ? "bg-muted-foreground/30" : "bg-destructive/60"
                      )} />
                      <span>{month.fullLabel}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Desktop / mobile landscape: horizontal month buttons
  return (
    <div className="landscape-compact mb-2 sm:mb-4 p-1.5 sm:p-3 bg-card rounded-lg border border-border print:hidden" lang="pt-BR" role="group" aria-label="Filtro de período">
      <div className="flex items-center gap-1.5 sm:gap-2">

        <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" aria-hidden="true" />
        
        {/* Year navigation */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6" aria-label={`Ano anterior (${selectedYear - 1})`} onClick={() => onYearChange(selectedYear - 1)}>
            <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          </Button>
          <span className="text-[10px] sm:text-xs font-semibold w-8 text-center" aria-live="polite">{selectedYear}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6" aria-label={`Próximo ano (${selectedYear + 1})`} onClick={() => onYearChange(selectedYear + 1)}>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>

        {/* All Year + Month buttons */}
        <div className="flex flex-1 gap-0.5 sm:gap-1" translate="no" role="group" aria-label="Selecionar mês">
            <Button
              variant={selectedMonth === null ? "default" : "outline"}
              size="sm"
              onClick={() => onMonthChange(null)}
              aria-pressed={selectedMonth === null}
              aria-label={`Todo o ano de ${selectedYear}`}
              className={cn(
                "h-6 sm:h-7 text-[7px] sm:text-[10px] px-0 flex-1 min-w-0",
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
                  aria-pressed={isSelected}
                  aria-label={`${month.fullLabel} de ${selectedYear}${hasData ? " — com lançamento" : isFuture ? " — futuro" : " — pendente"}`}
                  className={cn(
                    "h-6 sm:h-7 text-[7px] sm:text-[10px] px-0 flex-1 min-w-0",
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

      </div>
      
      {/* Legend */}
      <div className="landscape-hide flex flex-wrap gap-2 sm:gap-3 text-[7px] sm:text-[10px] text-muted-foreground mt-1">

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
