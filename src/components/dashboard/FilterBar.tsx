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
    <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-card rounded-xl border border-border print:hidden">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtros:</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.period}
          onValueChange={(value: "month" | "quarter" | "year") =>
            onFiltersChange({ ...filters, period: value })
          }
        >
          <SelectTrigger className="w-[140px] bg-background">
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
          <SelectTrigger className="w-[160px] bg-background">
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
      
      <div className="flex-1" />
      
      <Button
        variant="outline"
        size="sm"
        onClick={onPrint}
        className="gap-2"
      >
        <Printer className="h-4 w-4" />
        Imprimir / PDF
      </Button>
    </div>
  );
}
