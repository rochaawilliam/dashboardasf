import { useState } from "react";
import { cn } from "@/lib/utils";
import { Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Metric } from "@/hooks/useMetrics";

interface MetricCardMonthlyProps {
  metric: Metric;
  monthlyValue: number | null;
  isMonthSelected: boolean;
  accumulatedValue: number;
  onSave?: (metricId: string, value: number) => void;
  isSaving?: boolean;
}

const inverseMetrics = ["Churn de Clientes", "Turnover"];

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
  isSaving 
}: MetricCardMonthlyProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const isInverse = inverseMetrics.includes(metric.name);
  
  // Monthly target = annual target / 12
  const monthlyTarget = metric.target_value / 12;
  
  // For display: use monthlyValue if month selected, otherwise accumulated value
  const displayValue = isMonthSelected ? (monthlyValue ?? 0) : accumulatedValue;
  const targetForProgress = isMonthSelected ? monthlyTarget : metric.target_value;
  
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

  const handleSave = () => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && onSave) {
      onSave(metric.id, numValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  return (
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
              onClick={handleSave}
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
          {/* Target info */}
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">
              {isMonthSelected ? "Meta mensal" : "Meta anual"}
            </div>
            <div className="text-lg font-semibold">
              {targetForProgress.toFixed(2)}{metric.unit}
            </div>
          </div>
          
          {/* Current value */}
          {hasNoData ? (
            <div className="text-center py-2 mb-3">
              <span className="text-muted-foreground text-sm italic">Sem lançamento</span>
            </div>
          ) : (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1">
                {isMonthSelected ? "Valor lançado" : "Acumulado"}
              </div>
              <div className={cn(
                "text-2xl font-bold",
                status === "success" && "text-success",
                status === "warning" && "text-warning",
                status === "danger" && "text-destructive"
              )}>
                {displayValue.toFixed(2)}{metric.unit}
              </div>
            </div>
          )}
          
          {/* Progress bar */}
          <div className="space-y-2">
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
                {hasNoData ? "—" : `${progress.toFixed(0)}%`}
              </span>
              <span>100%</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
