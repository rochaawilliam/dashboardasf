import { AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metric } from "@/hooks/useMetrics";
import { formatMetricValue } from "@/utils/formatters";

interface AlertsSummaryProps {
  metrics: Metric[];
}

const inverseMetrics = ["Churn de Clientes", "Turnover"];

function getStatus(metric: Metric) {
  const isInverse = inverseMetrics.includes(metric.name);
  const ratio = metric.current_value / metric.target_value;
  
  if (isInverse) {
    if (ratio <= 1) return "success";
    if (ratio <= 1.15) return "warning";
    return "danger";
  }
  
  if (ratio >= 1) return "success";
  if (ratio >= 0.85) return "warning";
  return "danger";
}

export function AlertsSummary({ metrics }: AlertsSummaryProps) {
  const alerts = metrics
    .map((metric) => ({
      metric,
      status: getStatus(metric),
    }))
    .filter((item) => item.status !== "success");

  const dangerCount = alerts.filter((a) => a.status === "danger").length;
  const warningCount = alerts.filter((a) => a.status === "warning").length;
  const successCount = metrics.length - alerts.length;

  if (alerts.length === 0) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-6 print:break-inside-avoid">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <div>
            <h3 className="font-semibold text-success">Todas as metas atingidas!</h3>
            <p className="text-sm text-success/80">
              Parabéns! Todas as {metrics.length} métricas estão dentro da meta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6 print:break-inside-avoid">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <div>
          <h3 className="font-semibold text-foreground">Resumo de Alertas</h3>
          <p className="text-sm text-muted-foreground">
            {dangerCount > 0 && <span className="text-destructive font-medium">{dangerCount} crítico(s)</span>}
            {dangerCount > 0 && warningCount > 0 && " • "}
            {warningCount > 0 && <span className="text-warning font-medium">{warningCount} atenção</span>}
            {(dangerCount > 0 || warningCount > 0) && " • "}
            <span className="text-success font-medium">{successCount} OK</span>
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        {alerts.map(({ metric, status }) => (
          <div
            key={metric.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg text-sm",
              status === "danger" ? "bg-destructive/10" : "bg-warning/10"
            )}
          >
            <div className="flex items-center gap-2">
              <TrendingDown className={cn(
                "h-4 w-4",
                status === "danger" ? "text-destructive" : "text-warning"
              )} />
              <span className="font-medium">{metric.name}</span>
            </div>
            <div className="text-right">
              <span className={cn(
                "font-semibold",
                status === "danger" ? "text-destructive" : "text-warning"
              )}>
                {formatMetricValue(metric.current_value, metric.unit)}
              </span>
              <span className="text-muted-foreground ml-2">
                (meta: {formatMetricValue(metric.target_value, metric.unit)})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
