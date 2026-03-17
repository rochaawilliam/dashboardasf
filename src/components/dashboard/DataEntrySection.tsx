import { FileSpreadsheet, Upload, History, Target, ChevronDown, Activity, Filter, Printer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataEntryModal } from "./DataEntryModal";
import { MetricHistoryModal } from "./MetricHistoryModal";
import { MetricGoalEditor } from "./MetricGoalEditor";
import { ActivityFeedWidget } from "./ActivityFeedWidget";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Metric, TrainingHours, Filters, Division } from "@/hooks/useMetrics";
import { cn } from "@/lib/utils";

interface DataEntrySectionProps {
  metrics: Metric[];
  trainingHours?: TrainingHours[];
  showGoalEditor?: boolean;
  filters?: Filters;
  onFiltersChange?: (filters: Filters) => void;
  onPrint?: () => void;
}

type OpenPanel = "lancamentos" | "feed" | "filtros" | null;

export function DataEntrySection({ metrics, trainingHours, showGoalEditor = true, filters, onFiltersChange, onPrint }: DataEntrySectionProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [showGoals, setShowGoals] = useState(false);

  const togglePanel = (panel: OpenPanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="mb-2 sm:mb-4 print:hidden">
      {/* Three-column trigger buttons */}
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
        <Button
          variant="outline"
          onClick={() => togglePanel("lancamentos")}
          className="w-full justify-between h-auto py-1.5 sm:py-2 px-2 sm:px-3 border-2 bg-warning/90 text-warning-foreground border-warning/50 hover:bg-warning hover:border-warning shadow-md hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <div className="text-left min-w-0">
              <span className="text-[9px] sm:text-sm font-semibold block truncate">Lançamentos</span>
              <p className="text-[8px] sm:text-[10px] mt-0.5 hidden sm:block opacity-80">
                Entrada de dados, histórico e metas
              </p>
            </div>
          </div>
          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", openPanel === "lancamentos" && "rotate-180")} />
        </Button>

        <Button
          variant="outline"
          onClick={() => togglePanel("feed")}
          className="w-full justify-between h-auto py-1.5 sm:py-2 px-2 sm:px-3 border-2 bg-primary text-primary-foreground border-primary/50 hover:bg-primary/90 hover:border-primary shadow-md hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <div className="text-left min-w-0">
              <span className="text-[9px] sm:text-sm font-semibold block truncate">Atividades</span>
              <p className="text-[8px] sm:text-[10px] mt-0.5 hidden sm:block opacity-80">
                Registro de movimentações do sistema
              </p>
            </div>
          </div>
          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", openPanel === "feed" && "rotate-180")} />
        </Button>

        <Button
          variant="outline"
          onClick={() => togglePanel("filtros")}
          className="w-full justify-between h-auto py-1.5 sm:py-2 px-2 sm:px-3 border-2 bg-muted text-foreground border-border hover:bg-muted/80 hover:border-border shadow-md hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <div className="text-left min-w-0">
              <span className="text-[10px] sm:text-sm font-semibold block truncate">Filtros</span>
              <p className="text-[8px] sm:text-[10px] mt-0.5 hidden sm:block opacity-80">
                Período, divisão e impressão
              </p>
            </div>
          </div>
          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", openPanel === "filtros" && "rotate-180")} />
        </Button>
      </div>

      {/* Full-width content panel */}
      {openPanel === "lancamentos" && (
        <div className="mt-1.5 sm:mt-2 bg-card border-2 border-warning/30 rounded-lg p-2.5 sm:p-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {/* Single Entry */}
            <div className="flex flex-row sm:flex-col items-center sm:text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gap-3 sm:gap-0">
              <div className="sm:mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 sm:flex-none">
                <h4 className="font-medium text-xs mb-0.5">Lançamento Individual</h4>
                <p className="text-[10px] text-muted-foreground sm:mb-2 hidden sm:block">
                  Insira valores para uma métrica
                </p>
              </div>
              <DataEntryModal metrics={metrics} />
            </div>

            {/* History */}
            <div className="flex flex-row sm:flex-col items-center sm:text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gap-3 sm:gap-0">
              <div className="sm:mb-2">
                <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                  <History className="h-4 w-4 text-success" />
                </div>
              </div>
              <div className="flex-1 sm:flex-none">
                <h4 className="font-medium text-xs mb-0.5">Histórico</h4>
                <p className="text-[10px] text-muted-foreground sm:mb-2 hidden sm:block">
                  Visualize lançamentos anteriores
                </p>
              </div>
              <MetricHistoryModal metrics={metrics} />
            </div>

            {/* Goal Editor */}
            {showGoalEditor && (
              <div className="flex flex-row sm:flex-col items-center sm:text-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gap-3 sm:gap-0">
                <div className="sm:mb-2">
                  <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-warning" />
                  </div>
                </div>
                <div className="flex-1 sm:flex-none">
                  <h4 className="font-medium text-xs mb-0.5">Ajustar Metas</h4>
                  <p className="text-[10px] text-muted-foreground sm:mb-2 hidden sm:block">
                    Edite as metas anuais
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={showGoals ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGoals(!showGoals);
                  }}
                >
                  {showGoals ? "Ocultar" : "Exibir"}
                </Button>
              </div>
            )}
          </div>

          {/* Goal Editor Panel */}
          {showGoals && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Ajuste de Metas Anuais
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
                {[...metrics].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((metric) => (
                  <MetricGoalEditor key={metric.id} metric={metric} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {openPanel === "feed" && (
        <div className="mt-1.5 sm:mt-2 bg-card border-2 border-primary/30 rounded-lg p-2.5 sm:p-3">
          <ActivityFeedWidget />
        </div>
      )}

      {openPanel === "filtros" && filters && onFiltersChange && (
        <div className="mt-1.5 sm:mt-2 bg-card border-2 border-border rounded-lg p-2.5 sm:p-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
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
            
            {onPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="gap-1.5 h-8 sm:h-9 w-full sm:w-auto text-xs"
              >
                <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Imprimir / PDF</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
