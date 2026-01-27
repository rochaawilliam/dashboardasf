import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  target?: string | number;
  progress?: number;
  trend?: "up" | "down" | "neutral";
  status?: "success" | "warning" | "danger";
  unit?: string;
  description?: string;
}

const getStatusColor = (status: MetricCardProps["status"]) => {
  switch (status) {
    case "success":
      return "bg-success";
    case "warning":
      return "bg-warning";
    case "danger":
      return "bg-destructive";
    default:
      return "bg-primary";
  }
};

const getStatusBg = (status: MetricCardProps["status"]) => {
  switch (status) {
    case "success":
      return "bg-success/10 text-success";
    case "warning":
      return "bg-warning/10 text-warning";
    case "danger":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-primary/10 text-primary";
  }
};

export function MetricCard({
  label,
  value,
  target,
  progress,
  status = "success",
  unit = "%",
  description,
}: MetricCardProps) {
  return (
    <div className="metric-card group">
      <div className="flex items-start justify-between mb-3">
        <span className="metric-label">{label}</span>
        {target && (
          <span className={cn("category-badge", getStatusBg(status))}>
            Meta: {target}{unit}
          </span>
        )}
      </div>
      
      <div className="flex items-baseline gap-1 mb-3">
        <span className="metric-value">{value}</span>
        <span className="text-lg font-medium text-muted-foreground">{unit}</span>
      </div>

      {progress !== undefined && (
        <div className="space-y-2">
          <div className="progress-bar">
            <div
              className={cn("progress-fill", getStatusColor(status))}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {description && (
        <p className="mt-3 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
