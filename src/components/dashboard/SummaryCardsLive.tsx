import { Target, TrendingUp, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metric } from "@/hooks/useMetrics";
import { formatMetricValue, formatNumber } from "@/utils/formatters";

interface SummaryCardsLiveProps {
  metrics: Metric[];
}

const inverseMetrics = ["Churn de Clientes", "Turnover"];

function getChange(metric: Metric): { text: string; type: "positive" | "negative" | "neutral" } {
  const isInverse = inverseMetrics.includes(metric.name);
  const ratio = metric.current_value / metric.target_value;
  
  if (isInverse) {
    if (ratio <= 1) return { text: "No alvo", type: "positive" };
    return { text: `+${formatNumber((ratio - 1) * 100, 1)}%`, type: "negative" };
  }
  
  if (ratio >= 1) return { text: "No alvo", type: "positive" };
  if (ratio >= 0.95) return { text: "Quase lá", type: "neutral" };
  return { text: `-${formatNumber((1 - ratio) * 100, 1)}%`, type: "negative" };
}

const summaryConfig = [
  { name: "Cumprimento de Orçamento", icon: Target, colorClass: "bg-primary text-primary-foreground" },
  { name: "NPS", icon: TrendingUp, colorClass: "bg-success text-success-foreground" },
  { name: "Churn de Clientes", icon: Users, colorClass: "bg-accent text-accent-foreground" },
  { name: "Capacidade Ocupada (IC)", icon: Zap, colorClass: "bg-warning text-warning-foreground" },
];

export function SummaryCardsLive({ metrics }: SummaryCardsLiveProps) {
  const summaryData = summaryConfig.map((config) => {
    const metric = metrics.find((m) => m.name === config.name);
    if (!metric) return null;
    
    const change = getChange(metric);
    
    return {
      ...config,
      metric,
      value: formatMetricValue(metric.current_value, metric.unit),
      change: change.text,
      changeType: change.type,
    };
  }).filter(Boolean);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
      {summaryData.map((item) => {
        if (!item) return null;
        
        return (
          <div
            key={item.name}
            className="bg-card rounded-lg border border-border p-2 sm:p-3 lg:p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className={cn("p-1.5 rounded-lg", item.colorClass)}>
                <item.icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  item.changeType === "positive" && "bg-success/10 text-success",
                  item.changeType === "negative" && "bg-destructive/10 text-destructive",
                  item.changeType === "neutral" && "bg-muted text-muted-foreground"
                )}
              >
                {item.change}
              </span>
            </div>
            <div className="mt-1.5">
              <p className="text-sm sm:text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{item.name}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
