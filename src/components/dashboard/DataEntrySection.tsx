import { FileSpreadsheet, ChevronDown, Target } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DataEntryModal } from "./DataEntryModal";
import { BulkDataEntry } from "./BulkDataEntry";
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6 print:hidden">
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between h-auto py-3 px-4 bg-card rounded-xl hover:bg-card/80"
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Central de Lançamentos</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2">
        <div className="bg-card rounded-xl p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <DataEntryModal metrics={metrics} />
            {trainingHours && (
              <BulkDataEntry metrics={metrics} trainingHours={trainingHours} />
            )}
            <MetricHistoryModal metrics={metrics} />
            {showGoalEditor && (
              <Button 
                size="sm" 
                variant={showGoals ? "default" : "outline"}
                className="h-8 text-xs rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGoals(!showGoals);
                }}
              >
                <Target className="h-3.5 w-3.5 mr-1.5" />
                {showGoals ? "Ocultar Metas" : "Ajustar Metas"}
              </Button>
            )}
          </div>

          {/* Goal Editor Panel */}
          {showGoals && (
            <div className="pt-4 border-t border-border/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
