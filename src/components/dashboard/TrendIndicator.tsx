import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/formatters";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MetricHistory } from "@/hooks/useMetrics";
import { parseLocalDate } from "@/utils/dateUtils";

interface TrendIndicatorProps {
  metricId: string;
  metricName: string;
  historyData: MetricHistory[];
  isInverse?: boolean;
  className?: string;
}

type TrendType = "up" | "down" | "stable" | "unknown";

function calculateTrend(
  metricId: string,
  historyData: MetricHistory[]
): { trend: TrendType; percent: number; current: number; previous: number | null; monthsCount: number } {
  const metricHistory = historyData
    .filter(h => h.metric_id === metricId)
    .sort((a, b) => parseLocalDate(b.recorded_at).getTime() - parseLocalDate(a.recorded_at).getTime());
  
  if (metricHistory.length < 2) {
    return { 
      trend: "unknown", 
      percent: 0, 
      current: metricHistory[0]?.value ?? 0, 
      previous: null,
      monthsCount: metricHistory.length 
    };
  }
  
  const current = metricHistory[0]?.value ?? 0;
  const previous = metricHistory[1]?.value ?? 0;
  
  if (previous === 0) {
    return { 
      trend: current > 0 ? "up" : "stable", 
      percent: 100, 
      current, 
      previous,
      monthsCount: metricHistory.length 
    };
  }
  
  const percentChange = ((current - previous) / Math.abs(previous)) * 100;
  
  if (Math.abs(percentChange) < 1) {
    return { 
      trend: "stable", 
      percent: 0, 
      current, 
      previous,
      monthsCount: metricHistory.length 
    };
  }
  
  return {
    trend: percentChange > 0 ? "up" : "down",
    percent: Math.abs(percentChange),
    current,
    previous,
    monthsCount: metricHistory.length
  };
}

export function TrendIndicator({ 
  metricId, 
  metricName, 
  historyData, 
  isInverse = false,
  className 
}: TrendIndicatorProps) {
  const { trend, percent, monthsCount } = calculateTrend(metricId, historyData);
  
  if (trend === "unknown" || monthsCount < 2) {
    return null;
  }
  
  const isPositive = isInverse ? trend === "down" : trend === "up";
  const isNegative = isInverse ? trend === "up" : trend === "down";
  
  const getTrendIcon = () => {
    if (trend === "up") {
      return <TrendingUp className={cn("h-3.5 w-3.5", isPositive ? "text-success" : "text-destructive")} />;
    }
    if (trend === "down") {
      return <TrendingDown className={cn("h-3.5 w-3.5", isNegative ? "text-destructive" : "text-success")} />;
    }
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
            isPositive && "bg-success/10 text-success hover:bg-success/20",
            isNegative && "bg-destructive/10 text-destructive hover:bg-destructive/20",
            trend === "stable" && "bg-muted text-muted-foreground hover:bg-muted/80",
            className
          )}
        >
          {getTrendIcon()}
          <span>{percent > 0 ? `${formatNumber(percent, 1)}%` : "—"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" side="top">
        <div className="text-xs">
          <p className="font-medium mb-1">Tendência</p>
          <p className="text-muted-foreground">
            {trend === "up" && "Crescimento"}
            {trend === "down" && "Queda"}
            {trend === "stable" && "Estável"}
            {" vs. período anterior"}
          </p>
          <p className="text-muted-foreground mt-1">
            Baseado em {monthsCount} meses de dados
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
