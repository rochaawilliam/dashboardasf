import { Filter, Printer, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Filters, Division } from "@/hooks/useMetrics";

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onPrint: () => void;
}

export function FilterBar({ filters, onFiltersChange, onPrint }: FilterBarProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const filterContent = (
    <div className={cn(
      "flex items-stretch gap-1.5 sm:gap-4 flex-1",
      isMobile && "flex-col"
    )}>
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

  if (isMobile) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2 print:hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between h-8 text-xs gap-1.5 bg-card border-border"
          >
            <div className="flex items-center gap-1.5">
              <Filter className="h-3 w-3" />
              <span>Filtros</span>
            </div>
            <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1.5 p-2 bg-card rounded-lg border border-border">
          {filterContent}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="flex flex-row flex-wrap items-center gap-3 mb-4 p-3 bg-card rounded-lg border border-border print:hidden">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtros:</span>
      </div>
      {filterContent}
    </div>
  );
}
