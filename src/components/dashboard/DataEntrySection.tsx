import { FileSpreadsheet, Upload, History, ChevronDown } from "lucide-react";
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
import type { Metric, TrainingHours } from "@/hooks/useMetrics";
import { cn } from "@/lib/utils";

interface DataEntrySectionProps {
  metrics: Metric[];
  trainingHours?: TrainingHours[];
}

export function DataEntrySection({ metrics, trainingHours }: DataEntrySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4 sm:mb-6 print:hidden">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between h-auto py-2.5 sm:py-3 px-3 sm:px-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <div className="text-left">
              <span className="text-sm sm:text-base font-semibold">Central de Lançamentos</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
                Entrada de dados, importação em massa e histórico
              </p>
            </div>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2 sm:mt-3">
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {/* Single Entry */}
            <div className="flex flex-row sm:flex-col items-center sm:text-center p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gap-3 sm:gap-0">
              <div className="sm:mb-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1 sm:flex-none">
                <h4 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">Lançamento Individual</h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground sm:mb-3 hidden sm:block">
                  Insira valores para uma métrica específica
                </p>
              </div>
              <DataEntryModal metrics={metrics} />
            </div>
            
            {/* Bulk Entry */}
            <div className="flex flex-row sm:flex-col items-center sm:text-center p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gap-3 sm:gap-0">
              <div className="sm:mb-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                </div>
              </div>
              <div className="flex-1 sm:flex-none">
                <h4 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">Lançamento em Massa</h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground sm:mb-3 hidden sm:block">
                  Importe múltiplos valores de uma vez
                </p>
              </div>
              {trainingHours && (
                <BulkDataEntry metrics={metrics} trainingHours={trainingHours} />
              )}
            </div>
            
            {/* History */}
            <div className="flex flex-row sm:flex-col items-center sm:text-center p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gap-3 sm:gap-0">
              <div className="sm:mb-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <History className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                </div>
              </div>
              <div className="flex-1 sm:flex-none">
                <h4 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">Histórico</h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground sm:mb-3 hidden sm:block">
                  Visualize e edite lançamentos anteriores
                </p>
              </div>
              <MetricHistoryModal metrics={metrics} />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
