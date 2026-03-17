import { FileSpreadsheet, Upload, History, Target, ChevronDown, Activity } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DataEntryModal } from "./DataEntryModal";
import { MetricHistoryModal } from "./MetricHistoryModal";
import { MetricGoalEditor } from "./MetricGoalEditor";
import { ActivityFeedWidget } from "./ActivityFeedWidget";
import type { Metric, TrainingHours } from "@/hooks/useMetrics";
import { cn } from "@/lib/utils";

interface DataEntrySectionProps {
  metrics: Metric[];
  trainingHours?: TrainingHours[];
  showGoalEditor?: boolean;
}

export function DataEntrySection({ metrics, trainingHours, showGoalEditor = true }: DataEntrySectionProps) {
  const [isLancamentosOpen, setIsLancamentosOpen] = useState(false);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  return (
    <div className="mb-2 sm:mb-4 print:hidden space-y-1.5 sm:space-y-2">
      {/* Collapsible 1: Central de Lançamentos */}
      <Collapsible open={isLancamentosOpen} onOpenChange={setIsLancamentosOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto py-1.5 sm:py-2.5 px-2 sm:px-3 border-2 bg-warning/90 text-warning-foreground border-warning/50 hover:bg-warning hover:border-warning shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <FileSpreadsheet className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              <div className="text-left">
                <span className="text-xs sm:text-base font-semibold">Central de Lançamentos</span>
                <p className="text-[9px] sm:text-xs mt-0.5 hidden sm:block opacity-80">
                  Entrada de dados, histórico e ajuste de metas
                </p>
              </div>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform", isLancamentosOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-1.5 sm:mt-2">
          <div className="bg-card border-2 border-warning/30 rounded-lg p-3">
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
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible 2: Feed de Atividades */}
      <Collapsible open={isFeedOpen} onOpenChange={setIsFeedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto py-1.5 sm:py-2.5 px-2 sm:px-3 border-2 bg-primary text-primary-foreground border-primary/50 hover:bg-primary/90 hover:border-primary shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Activity className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              <div className="text-left">
                <span className="text-xs sm:text-base font-semibold">Feed de Atividades</span>
                <p className="text-[9px] sm:text-xs mt-0.5 hidden sm:block opacity-80">
                  Registro de todas as movimentações do sistema
                </p>
              </div>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform", isFeedOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-1.5 sm:mt-2">
          <div className="bg-card border-2 border-primary/30 rounded-lg p-3">
            <ActivityFeedWidget />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
