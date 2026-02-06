import { useState } from "react";
import { cn } from "@/lib/utils";
import { Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Metric } from "@/hooks/useMetrics";
import { formatMetricValue, formatNumber } from "@/utils/formatters";

interface MetricCardMonthlyProps {
  metric: Metric;
  monthlyValue: number | null;
  isMonthSelected: boolean;
  accumulatedValue: number;
  onSave?: (metricId: string, value: number) => void;
  isSaving?: boolean;
  selectedMonthName?: string;
}

const inverseMetrics = ["Churn de Clientes", "Turnover"];

// Metrics where annual target = monthly target (averages, rates, percentages)
// These are metrics that don't accumulate over time
const nonAccumulativeKeywords = [
  "Ticket Médio",
  "Margem",
  "Churn",
  "Custo Fixo",
  "Folha sobre Receita",
  "Inadimplência",
  "Cumprimento do Orçamento",
  "Lead Time",
  "SLA",
  "NPS",
  "ENPS",
  "Taxa",
  "Turnover",
  "LTV",
  "Upsell",
];

function isNonAccumulativeMetric(name: string, unit: string): boolean {
  // Check if unit is percentage
  if (unit === "%" || unit.toLowerCase().includes("percent")) {
    return true;
  }
  // Check if name contains any non-accumulative keyword
  return nonAccumulativeKeywords.some(keyword => 
    name.toLowerCase().includes(keyword.toLowerCase())
  );
}

const getStatus = (current: number, target: number, isInverse: boolean = false) => {
  if (target === 0) return "warning";
  const ratio = current / target;
  if (isInverse) {
    if (ratio <= 1) return "success";
    if (ratio <= 1.15) return "warning";
    return "danger";
  }
  if (ratio >= 1) return "success";
  if (ratio >= 0.85) return "warning";
  return "danger";
};

const getStatusColor = (status: "success" | "warning" | "danger") => {
  switch (status) {
    case "success": return "bg-success";
    case "warning": return "bg-warning";
    case "danger": return "bg-destructive";
  }
};

export function MetricCardMonthly({ 
  metric, 
  monthlyValue, 
  isMonthSelected,
  accumulatedValue,
  onSave,
  isSaving,
  selectedMonthName
}: MetricCardMonthlyProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingValue, setPendingValue] = useState<number | null>(null);

  const isInverse = inverseMetrics.includes(metric.name);
  const isNonAccumulative = isNonAccumulativeMetric(metric.name, metric.unit);
  
  // For non-accumulative metrics, monthly target = annual target
  // For accumulative metrics, monthly target = annual target / 12
  const monthlyTarget = isNonAccumulative ? metric.target_value : metric.target_value / 12;
  
  // For non-accumulative metrics: use average instead of sum
  // For display: use monthlyValue if month selected, otherwise calculate appropriately
  const displayValue = isMonthSelected ? (monthlyValue ?? 0) : accumulatedValue;
  
  // For non-accumulative metrics, target is always the same (monthly = annual)
  const targetForProgress = isNonAccumulative 
    ? metric.target_value 
    : (isMonthSelected ? monthlyTarget : metric.target_value);
  
  const status = getStatus(displayValue, targetForProgress, isInverse);
  const progress = isInverse 
    ? targetForProgress > 0 && displayValue > 0 
      ? Math.min((targetForProgress / displayValue) * 100, 100) 
      : displayValue === 0 ? 100 : 0
    : targetForProgress > 0 
      ? Math.min((displayValue / targetForProgress) * 100, 100)
      : 0;

  const hasNoData = isMonthSelected && monthlyValue === null;

  const handleStartEdit = () => {
    setEditValue(monthlyValue?.toString() ?? "0");
    setIsEditing(true);
  };

  const handleRequestSave = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue)) {
      setPendingValue(numValue);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSave = () => {
    if (pendingValue !== null && onSave) {
      onSave(metric.id, pendingValue);
    }
    setShowConfirmDialog(false);
    setIsEditing(false);
    setPendingValue(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingValue(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  return (
    <>
      <div className={cn(
        "metric-card group relative",
        status === "danger" && !hasNoData && "ring-2 ring-destructive/50"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <span className="metric-label flex-1 text-sm font-medium">{metric.name}</span>
          {isMonthSelected && onSave && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        
        {/* Editing mode */}
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-9"
                autoFocus
              />
              <span className="text-sm text-muted-foreground">{metric.unit}</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleRequestSave}
                disabled={isSaving}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Annual target (main goal) */}
            <div className="mb-3 p-2 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">
                🎯 Meta {isNonAccumulative ? "(Mensal = Anual)" : "Anual (Objetivo)"}
              </div>
              <div className="text-lg font-bold">
                {formatMetricValue(metric.target_value, metric.unit, metric.name)}
              </div>
            </div>
            
            {/* Monthly target (progress reference) - only show if accumulative */}
            {!isNonAccumulative && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">
                  📊 Meta Mensal (Referência)
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {formatMetricValue(monthlyTarget, metric.unit, metric.name)}
                </div>
              </div>
            )}
            
            {/* Current value */}
            {hasNoData ? (
              <div className="text-center py-2 mb-3">
                <span className="text-muted-foreground text-sm italic">Sem lançamento</span>
              </div>
            ) : (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">
                  {isMonthSelected ? "📝 Valor Lançado" : "📈 Acumulado no Ano"}
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  status === "success" && "text-success",
                  status === "warning" && "text-warning",
                  status === "danger" && "text-destructive"
                )}>
                  {formatMetricValue(displayValue, metric.unit, metric.name)}
                </div>
              </div>
            )}
            
            {/* Progress bar - shows progress toward annual goal */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso para meta anual</span>
              </div>
              <div className="progress-bar h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    hasNoData ? "bg-muted" : getStatusColor(status)
                  )}
                  style={{ width: `${hasNoData ? 0 : progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className={cn(
                  "font-medium",
                  !hasNoData && status === "success" && "text-success",
                  !hasNoData && status === "warning" && "text-warning",
                  !hasNoData && status === "danger" && "text-destructive"
                )}>
                  {hasNoData ? "—" : `${formatNumber(progress, 0)}%`}
                </span>
                <span>100%</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a salvar o valor <strong>{pendingValue !== null ? formatMetricValue(pendingValue, metric.unit, metric.name) : ""}</strong> para a métrica <strong>{metric.name}</strong>
              {selectedMonthName && <> em <strong>{selectedMonthName}</strong></>}.
              <br /><br />
              Deseja confirmar este lançamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirm}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
