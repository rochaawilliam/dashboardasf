import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import type { Metric } from "@/hooks/useMetrics";

interface MetricCardMonthlyProps {
  metric: Metric;
  monthlyValue: number | null; // null if no data for selected month
  isMonthSelected: boolean;
}

const inverseMetrics = ["Churn de Clientes", "Turnover"];

const getStatus = (current: number, target: number, isInverse: boolean = false) => {
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

const getStatusBg = (status: "success" | "warning" | "danger") => {
  switch (status) {
    case "success": return "bg-success/10 text-success";
    case "warning": return "bg-warning/10 text-warning";
    case "danger": return "bg-destructive/10 text-destructive";
  }
};

export function MetricCardMonthly({ metric, monthlyValue, isMonthSelected }: MetricCardMonthlyProps) {
  const isInverse = inverseMetrics.includes(metric.name);
  
  // Monthly target = annual target / 12
  const monthlyTarget = metric.target_value / 12;
  
  // For display: use monthlyValue if month selected, otherwise accumulated current_value
  const displayValue = isMonthSelected ? (monthlyValue ?? 0) : metric.current_value;
  const targetForProgress = isMonthSelected ? monthlyTarget : metric.target_value;
  
  const status = getStatus(displayValue, targetForProgress, isInverse);
  const progress = isInverse 
    ? displayValue > 0 ? Math.min((targetForProgress / displayValue) * 100, 100) : 100
    : Math.min((displayValue / targetForProgress) * 100, 100);
  
  const isAboveTarget = isInverse 
    ? displayValue <= targetForProgress
    : displayValue >= targetForProgress;

  const hasNoData = isMonthSelected && monthlyValue === null;

  return (
    <div className={cn(
      "metric-card group relative",
      status === "danger" && !hasNoData && "ring-2 ring-destructive/50"
    )}>
      {/* Alert indicator */}
      {status === "danger" && !hasNoData && (
        <div className="absolute -top-2 -right-2 p-1.5 bg-destructive rounded-full shadow-lg">
          <AlertTriangle className="h-4 w-4 text-destructive-foreground" />
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="metric-label flex-1">{metric.name}</span>
      </div>
      
      {/* Value */}
      {hasNoData ? (
        <div className="text-center py-4">
          <span className="text-muted-foreground text-sm">Sem lançamento</span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="metric-value">{displayValue.toFixed(2)}</span>
            <span className="text-lg font-medium text-muted-foreground">{metric.unit}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className={cn("category-badge", getStatusBg(status))}>
              Meta: {targetForProgress.toFixed(2)}{metric.unit}
            </span>
            {isAboveTarget ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </div>
        </>
      )}
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="progress-bar">
          <div
            className={cn("progress-fill", hasNoData ? "bg-muted" : getStatusColor(status))}
            style={{ width: `${hasNoData ? 0 : progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span className={cn("font-medium", hasNoData ? "" : getStatusBg(status).split(" ")[1])}>
            {hasNoData ? "—" : `${progress.toFixed(0)}%`}
          </span>
          <span>100%</span>
        </div>
      </div>
      
      {metric.description && (
        <p className="mt-3 text-xs text-muted-foreground">{metric.description}</p>
      )}
      
      {/* Period indicator */}
      <div className="mt-3 pt-2 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          {isMonthSelected ? "Meta mensal" : "Meta anual (acumulado)"}
        </span>
      </div>
    </div>
  );
}
