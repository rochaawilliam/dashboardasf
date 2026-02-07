import { Filter, Calendar, Printer } from "lucide-react";
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
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-card rounded-xl border border-border print:hidden">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
        <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>Filtros:</span>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 flex-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
          <Select
            value={filters.period}
            onValueChange={(value: "month" | "quarter" | "year") =>
              onFiltersChange({ ...filters, period: value })
            }
          >
            <SelectTrigger className="w-full sm:w-[140px] bg-background text-sm h-9">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border z-50">
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={filters.division}
            onValueChange={(value: Division | "all") =>
              onFiltersChange({ ...filters, division: value })
            }
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-background text-sm h-9">
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
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onPrint}
        className="gap-2 h-9 w-full sm:w-auto"
      >
        <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="sm:inline">Imprimir / PDF</span>
      </Button>
    </div>
  );
}
