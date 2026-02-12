import { Filter, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Filters, Division } from "@/hooks/useMetrics";

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onPrint: () => void;
}

export function FilterBar({ filters, onFiltersChange, onPrint }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-1.5 sm:gap-3 mb-2 sm:mb-4 p-2 sm:p-3 bg-card rounded-lg border border-border print:hidden">
      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
        <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
        <span>Filtros:</span>
      </div>
      
      <div className="flex items-stretch gap-1.5 sm:gap-4 flex-1">
        <Select
          value={filters.period}
          onValueChange={(value: "month" | "quarter" | "year") =>
            onFiltersChange({ ...filters, period: value })
          }
        >
          <SelectTrigger className="flex-1 sm:w-[140px] sm:flex-none bg-background text-xs sm:text-sm h-8 sm:h-9">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border z-50">
            <SelectItem value="month">Último Mês</SelectItem>
            <SelectItem value="quarter">Último Trimestre</SelectItem>
            <SelectItem value="year">Último Ano</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={filters.division}
          onValueChange={(value: Division | "all") =>
            onFiltersChange({ ...filters, division: value })
          }
        >
          <SelectTrigger className="flex-1 sm:w-[160px] sm:flex-none bg-background text-xs sm:text-sm h-8 sm:h-9">
            <SelectValue placeholder="Divisão" />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border z-50">
            <SelectItem value="all">Todas Divisões</SelectItem>
            <SelectItem value="juridico">Jurídico</SelectItem>
            <SelectItem value="crescimento">Crescimento</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="administrativo">Administrativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onPrint}
        className="gap-1.5 h-8 sm:h-9 w-full sm:w-auto text-xs"
      >
        <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
        <span>Imprimir / PDF</span>
      </Button>
    </div>
  );
}
