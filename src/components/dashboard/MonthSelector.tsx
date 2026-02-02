import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

interface MonthSelectorProps {
  selectedMonth: number | null; // null = "Todo o Período"
  selectedYear: number;
  onMonthChange: (month: number | null) => void;
  onYearChange: (year: number) => void;
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
  onYearChange 
}: MonthSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="mb-6 space-y-3">
      {/* Year selector */}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground mr-2">Ano:</span>
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

      {/* Month buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedMonth === null ? "default" : "outline"}
          size="sm"
          onClick={() => onMonthChange(null)}
          className={cn(
            "h-9 px-4",
            selectedMonth === null && "bg-primary text-primary-foreground"
          )}
        >
          Todo o Período
        </Button>
        
        <div className="h-6 w-px bg-border mx-1" />
        
        {months.map((month) => (
          <Button
            key={month.value}
            variant={selectedMonth === month.value ? "default" : "outline"}
            size="sm"
            onClick={() => onMonthChange(month.value)}
            className={cn(
              "h-9 px-3 min-w-[50px]",
              selectedMonth === month.value && "bg-primary text-primary-foreground"
            )}
          >
            <span className="hidden sm:inline">{month.fullLabel}</span>
            <span className="sm:hidden">{month.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
