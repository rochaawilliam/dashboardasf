import { FileSpreadsheet, Upload, History, Target, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [showGoals, setShowGoals] = useState(false);

  return (
    <div className="mb-2 sm:mb-4 print:hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Column 1: Central de Lançamentos */}
        <div className="bg-card border border-border rounded-lg p-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Central de Lançamentos
          </h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-1.5">
                {[...metrics].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((metric) => (
                  <MetricGoalEditor key={metric.id} metric={metric} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Activity Feed */}
        <div className="bg-card border border-border rounded-lg p-3">
          <ActivityFeedWidget />
        </div>
      </div>
    </div>
  );
}
