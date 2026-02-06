import { useState } from "react";
import { 
  Bell,
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Metric, MetricHistory } from "@/hooks/useMetrics";
import { formatMetricValue, formatNumber } from "@/utils/formatters";
import { parseISO } from "date-fns";

interface NotificationBellProps {
  metrics: Metric[];
  historyData?: MetricHistory[];
  selectedYear: number;
}

type TrendType = "up" | "down" | "stable" | "unknown";
type AlertSeverity = "critical" | "warning" | "info" | "success";

interface MetricAlert {
  metric: Metric;
  severity: AlertSeverity;
  trend: TrendType;
  trendPercent: number;
  message: string;
  currentValue: number;
  previousValue: number | null;
  progressPercent: number;
}

const inverseMetrics = ["Churn de Clientes", "Turnover"];

function calculateTrend(
  metricId: string,
  historyData: MetricHistory[]
): { trend: TrendType; percent: number; current: number; previous: number | null } {
  const metricHistory = historyData
    .filter(h => h.metric_id === metricId)
    .sort((a, b) => parseISO(b.recorded_at).getTime() - parseISO(a.recorded_at).getTime());
  
  if (metricHistory.length < 2) {
    return { trend: "unknown", percent: 0, current: metricHistory[0]?.value ?? 0, previous: null };
  }
  
  const current = metricHistory[0]?.value ?? 0;
  const previous = metricHistory[1]?.value ?? 0;
  
  if (previous === 0) {
    return { trend: current > 0 ? "up" : "stable", percent: 100, current, previous };
  }
  
  const percentChange = ((current - previous) / Math.abs(previous)) * 100;
  
  if (Math.abs(percentChange) < 1) {
    return { trend: "stable", percent: 0, current, previous };
  }
  
  return {
    trend: percentChange > 0 ? "up" : "down",
    percent: Math.abs(percentChange),
    current,
    previous
  };
}

function getAlertSeverity(metric: Metric, progressPercent: number): AlertSeverity {
  const isInverse = inverseMetrics.includes(metric.name);
  
  if (isInverse) {
    if (progressPercent <= 100) return "success";
    if (progressPercent <= 115) return "warning";
    return "critical";
  }
  
  if (progressPercent >= 100) return "success";
  if (progressPercent >= 85) return "warning";
  if (progressPercent >= 50) return "info";
  return "critical";
}

function getMessage(severity: AlertSeverity, trend: TrendType, isInverse: boolean): string {
  if (severity === "success") {
    return trend === "up" && !isInverse ? "Meta atingida com crescimento" : "Meta atingida";
  }
  if (severity === "critical") {
    return trend === "down" && !isInverse ? "Abaixo da meta com queda" : "Abaixo da meta";
  }
  if (severity === "warning") {
    return "Próximo da meta, atenção necessária";
  }
  return "Em progresso, monitorar tendência";
}

export function NotificationBell({ metrics, historyData = [], selectedYear }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const alerts: MetricAlert[] = metrics.map(metric => {
    const { trend, percent, current, previous } = calculateTrend(metric.id, historyData);
    const progressPercent = metric.target_value > 0 
      ? (metric.current_value / metric.target_value) * 100 
      : 0;
    const severity = getAlertSeverity(metric, progressPercent);
    const isInverse = inverseMetrics.includes(metric.name);
    
    return {
      metric,
      severity,
      trend,
      trendPercent: percent,
      message: getMessage(severity, trend, isInverse),
      currentValue: current,
      previousValue: previous,
      progressPercent
    };
  }).sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const warningCount = alerts.filter(a => a.severity === "warning").length;
  const successCount = alerts.filter(a => a.severity === "success").length;
  const hasAlerts = criticalCount > 0 || warningCount > 0;
  
  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical": return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "info": return <Clock className="h-4 w-4 text-primary" />;
      case "success": return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
  };
  
  const getTrendIcon = (trend: TrendType, isInverse: boolean) => {
    const isPositive = isInverse ? trend === "down" : trend === "up";
    const isNegative = isInverse ? trend === "up" : trend === "down";
    
    if (trend === "up") {
      return <TrendingUp className={cn("h-3.5 w-3.5", isPositive ? "text-success" : "text-destructive")} />;
    }
    if (trend === "down") {
      return <TrendingDown className={cn("h-3.5 w-3.5", isNegative ? "text-destructive" : "text-success")} />;
    }
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };
  
  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive" className="text-[10px] px-1.5">Crítico</Badge>;
      case "warning": return <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5">Atenção</Badge>;
      case "info": return <Badge variant="secondary" className="text-[10px] px-1.5">Info</Badge>;
      case "success": return <Badge className="bg-success text-success-foreground text-[10px] px-1.5">OK</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 border border-border/50 relative"
          title="Central de Alertas"
        >
          <Bell className="h-4 w-4" />
          {hasAlerts && (
            <span className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full text-[10px] flex items-center justify-center font-bold",
              criticalCount > 0 ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"
            )}>
              {criticalCount + warningCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Central de Alertas
            </SheetTitle>
          </div>
          <div className="flex items-center gap-3 text-xs mt-2">
            {criticalCount > 0 && (
              <span className="text-destructive font-medium">{criticalCount} críticos</span>
            )}
            {warningCount > 0 && (
              <span className="text-warning font-medium">{warningCount} atenção</span>
            )}
            <span className="text-success font-medium">{successCount} OK</span>
          </div>
        </SheetHeader>
        
        {/* Legend */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Indicadores de Desempenho</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span>Crescimento</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-destructive" />
              <span>Queda</span>
            </div>
          </div>
        </div>
        
        {/* Alerts list */}
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="divide-y divide-border">
            {alerts.map(alert => {
              const isInverse = inverseMetrics.includes(alert.metric.name);
              
              return (
                <Popover key={alert.metric.id}>
                  <PopoverTrigger asChild>
                    <div className="px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Severity icon */}
                        <div className="flex-shrink-0">
                          {getSeverityIcon(alert.severity)}
                        </div>
                        
                        {/* Metric name and message */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {alert.metric.name}
                            </span>
                            {getSeverityBadge(alert.severity)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {alert.message}
                          </p>
                        </div>
                        
                        {/* Trend indicator */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {alert.trend !== "unknown" && (
                            <div className="flex items-center gap-1">
                              {getTrendIcon(alert.trend, isInverse)}
                              <span className={cn(
                                "text-xs font-medium",
                                alert.trend === "up" && (isInverse ? "text-destructive" : "text-success"),
                                alert.trend === "down" && (isInverse ? "text-success" : "text-destructive"),
                                alert.trend === "stable" && "text-muted-foreground"
                              )}>
                                {alert.trendPercent > 0 ? `${formatNumber(alert.trendPercent, 1)}%` : "—"}
                              </span>
                            </div>
                          )}
                          
                          {/* Progress */}
                          <div className="w-14 text-right">
                            <span className={cn(
                              "text-sm font-bold",
                              alert.severity === "success" && "text-success",
                              alert.severity === "warning" && "text-warning",
                              alert.severity === "critical" && "text-destructive"
                            )}>
                              {formatNumber(alert.progressPercent, 0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mini progress bar */}
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            alert.severity === "success" && "bg-success",
                            alert.severity === "warning" && "bg-warning",
                            alert.severity === "critical" && "bg-destructive",
                            alert.severity === "info" && "bg-primary"
                          )}
                          style={{ width: `${Math.min(alert.progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" side="left">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm">{alert.metric.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">Atual</span>
                          <p className="font-semibold">
                            {formatMetricValue(alert.metric.current_value, alert.metric.unit, alert.metric.name)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Meta</span>
                          <p className="font-semibold">
                            {formatMetricValue(alert.metric.target_value, alert.metric.unit, alert.metric.name)}
                          </p>
                        </div>
                      </div>
                      
                      {alert.previousValue !== null && (
                        <div className="pt-2 border-t border-border">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Variação</span>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(alert.trend, isInverse)}
                              <span className={cn(
                                "font-medium",
                                alert.trend === "up" && (isInverse ? "text-destructive" : "text-success"),
                                alert.trend === "down" && (isInverse ? "text-success" : "text-destructive")
                              )}>
                                {alert.trendPercent > 0 ? `${formatNumber(alert.trendPercent, 1)}%` : "Estável"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
