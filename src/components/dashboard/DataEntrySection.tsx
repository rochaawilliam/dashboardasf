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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6 print:hidden">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between h-auto py-3 px-4"
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div className="text-left">
              <span className="font-semibold">Central de Lançamentos</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Entrada de dados, importação em massa e histórico
              </p>
            </div>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Single Entry */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h4 className="font-medium text-sm mb-1">Lançamento Individual</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Insira valores para uma métrica específica
              </p>
              <DataEntryModal metrics={metrics} />
            </div>
            
            {/* Bulk Entry */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="mb-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-accent-foreground" />
                </div>
              </div>
              <h4 className="font-medium text-sm mb-1">Lançamento em Massa</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Importe múltiplos valores de uma vez
              </p>
              {trainingHours && (
                <BulkDataEntry metrics={metrics} trainingHours={trainingHours} />
              )}
            </div>
            
            {/* History */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="mb-3">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <History className="h-5 w-5 text-success" />
                </div>
              </div>
              <h4 className="font-medium text-sm mb-1">Histórico</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Visualize e edite lançamentos anteriores
              </p>
              <MetricHistoryModal metrics={metrics} />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
