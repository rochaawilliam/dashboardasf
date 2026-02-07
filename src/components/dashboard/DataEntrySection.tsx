import { FileSpreadsheet, Upload, History, ChevronDown, Target } from "lucide-react";
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
import type { Metric, TrainingHours } from "@/hooks/useMetrics";
import { cn } from "@/lib/utils";

interface DataEntrySectionProps {
  metrics: Metric[];
  trainingHours?: TrainingHours[];
  showGoalEditor?: boolean;
}

export function DataEntrySection({ metrics, trainingHours, showGoalEditor = true }: DataEntrySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4 sm:mb-6 print:hidden">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "w-full justify-between h-auto py-2.5 sm:py-3 px-3 sm:px-4 border-2",
            "bg-gradient-to-r from-amber-500/90 to-yellow-500/90 text-white border-amber-400/50",
            "hover:from-amber-500 hover:to-yellow-500 hover:border-amber-400",
            "dark:from-amber-600/90 dark:to-yellow-600/90 dark:border-amber-500/50",
            "dark:hover:from-amber-600 dark:hover:to-yellow-600",
            "shadow-md hover:shadow-lg transition-all"
          )}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            <div className="text-left">
              <span className="text-sm sm:text-base font-semibold text-white">Central de Lançamentos</span>
              <p className="text-[10px] sm:text-xs mt-0.5 hidden sm:block text-white/80">
                Entrada de dados, histórico e ajuste de metas
              </p>
            </div>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-white transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2 sm:mt-3">
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
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
                {metrics.map((metric) => (
                  <MetricGoalEditor key={metric.id} metric={metric} />
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
