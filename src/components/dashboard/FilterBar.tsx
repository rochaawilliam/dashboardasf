import { Printer } from "lucide-react";
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
    <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
      <Select
        value={filters.period}
        onValueChange={(value: "month" | "quarter" | "year") =>
          onFiltersChange({ ...filters, period: value })
        }
      >
        <SelectTrigger className="w-[140px] bg-card border-0 text-xs h-9 rounded-lg">
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
        <SelectTrigger className="w-[160px] bg-card border-0 text-xs h-9 rounded-lg">
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
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrint}
        className="gap-2 h-9 rounded-lg ml-auto"
      >
        <Printer className="h-4 w-4" />
        <span>PDF</span>
      </Button>
    </div>
  );
}
