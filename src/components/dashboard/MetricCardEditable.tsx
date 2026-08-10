import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Check, X, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { formatMetricValue } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateMetric, type Metric } from "@/hooks/useMetrics";

interface MetricCardEditableProps {
  metric: Metric;
  showAlert?: boolean;
}

const getStatus = (current: number, target: number, isInverse: boolean = false) => {
  const ratio = current / target;
  if (isInverse) {
    // For metrics like Churn where lower is better
    if (ratio <= 1) return "success";
    if (ratio <= 1.15) return "warning";
    return "danger";
  }
  if (ratio >= 1) return "success";
  if (ratio >= 0.85) return "warning";
  return "danger";
};

const inverseMetrics = ["Churn de Clientes", "Turnover"];

const getStatusColor = (status: "success" | "warning" | "danger") => {
  switch (status) {
    case "success":
      return "bg-success";
    case "warning":
      return "bg-warning";
    case "danger":
      return "bg-primary";
  }
};

const getStatusBg = (status: "success" | "warning" | "danger") => {
  switch (status) {
    case "success":
      return "bg-success/10 text-success";
    case "warning":
      return "bg-warning/10 text-warning";
    case "danger":
      return "bg-primary/10 text-primary";
  }
};

export function MetricCardEditable({ metric, showAlert = true }: MetricCardEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(metric.current_value.toString());
  const [targetValue, setTargetValue] = useState(metric.target_value.toString());
  
  const updateMetric = useUpdateMetric();
  
  const isInverse = inverseMetrics.includes(metric.name);
  const status = getStatus(metric.current_value, metric.target_value, isInverse);
  const progress = isInverse 
    ? Math.min((metric.target_value / metric.current_value) * 100, 100)
    : Math.min((metric.current_value / metric.target_value) * 100, 100);
  
  const isAboveTarget = isInverse 
    ? metric.current_value <= metric.target_value
    : metric.current_value >= metric.target_value;

  const handleSave = () => {
    updateMetric.mutate({
      id: metric.id,
      current_value: parseFloat(currentValue),
      target_value: parseFloat(targetValue),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(metric.current_value.toString());
    setTargetValue(metric.target_value.toString());
    setIsEditing(false);
  };

  return (
    <div className={cn(
      "metric-card group relative",
      showAlert && status === "danger" && "ring-2 ring-primary/50 animate-pulse"
    )}>
      {/* Alert indicator */}
      {showAlert && status === "danger" && (
        <div className="absolute -top-2 -right-2 p-1.5 bg-primary rounded-full shadow-lg">
          <AlertTriangle className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="metric-label flex-1">{metric.name}</span>
        
        {!isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <div className="flex gap-1 print:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-success hover:text-success"
              onClick={handleSave}
              disabled={updateMetric.isPending}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleCancel}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Value */}
      {isEditing ? (
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-sm text-muted-foreground">Valor Atual</label>
            <Input
              type="number"
              step="0.01"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="h-9 mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Meta</label>
            <Input
              type="number"
              step="0.01"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="h-9 mt-1"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="metric-value">{formatMetricValue(metric.current_value, metric.unit, metric.name)}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className={cn("category-badge", getStatusBg(status))}>
              Meta: {formatMetricValue(metric.target_value, metric.unit, metric.name)}
            </span>
            {isAboveTarget ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-primary" />
            )}
          </div>
        </>
      )}
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="progress-bar">
          <div
            className={cn("progress-fill", getStatusColor(status))}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>0%</span>
          <span className={cn("font-semibold", getStatusBg(status).split(" ")[1])}>
            {progress.toFixed(0)}%
          </span>
          <span>100%</span>
        </div>
      </div>
      
      {metric.description && (
        <p className="mt-3 text-sm text-muted-foreground">{metric.description}</p>
      )}
    </div>
  );
}
