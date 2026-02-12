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
  Check,
  CheckCheck,
  Trash2,
  RotateCcw,
  MoreHorizontal,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Metric, MetricHistory } from "@/hooks/useMetrics";
import { formatMetricValue, formatNumber } from "@/utils/formatters";
import { parseISO } from "date-fns";
import { useNotificationState } from "@/hooks/useNotificationState";

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

const getSeverityIcon = (severity: AlertSeverity) => {
  switch (severity) {
    case "critical": return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    case "warning": return <AlertTriangle className="h-3.5 w-3.5 text-warning" />;
    case "info": return <Clock className="h-3.5 w-3.5 text-primary" />;
    case "success": return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  }
};

const getTrendIcon = (trend: TrendType, isInverse: boolean) => {
  const isPositive = isInverse ? trend === "down" : trend === "up";
  const isNegative = isInverse ? trend === "up" : trend === "down";
  
  if (trend === "up") {
    return <TrendingUp className={cn("h-3 w-3", isPositive ? "text-success" : "text-destructive")} />;
  }
  if (trend === "down") {
    return <TrendingDown className={cn("h-3 w-3", isNegative ? "text-destructive" : "text-success")} />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

const getSeverityBadge = (severity: AlertSeverity) => {
  switch (severity) {
    case "critical": return <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Crítico</Badge>;
    case "warning": return <Badge className="bg-warning text-warning-foreground text-[9px] px-1.5 py-0">Atenção</Badge>;
    case "info": return <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Info</Badge>;
    case "success": return <Badge className="bg-success text-success-foreground text-[9px] px-1.5 py-0">OK</Badge>;
  }
};

export function NotificationBell({ metrics, historyData = [], selectedYear }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "critical">("all");
  const notifState = useNotificationState();
  
  const allAlerts: MetricAlert[] = metrics.map(metric => {
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

  // Filter out dismissed
  const visibleAlerts = allAlerts.filter(a => !notifState.isDismissed(a.metric.id));
  
  // Apply filter
  const filteredAlerts = visibleAlerts.filter(a => {
    if (filter === "unread") return !notifState.isRead(a.metric.id);
    if (filter === "read") return notifState.isRead(a.metric.id);
    if (filter === "critical") return a.severity === "critical" || a.severity === "warning";
    return true;
  });
  
  const unreadCount = visibleAlerts.filter(a => !notifState.isRead(a.metric.id) && (a.severity === "critical" || a.severity === "warning")).length;
  const criticalCount = visibleAlerts.filter(a => a.severity === "critical").length;
  const warningCount = visibleAlerts.filter(a => a.severity === "warning").length;
  const successCount = visibleAlerts.filter(a => a.severity === "success").length;
  const hasAlerts = unreadCount > 0;

  const handleMarkAllRead = () => {
    notifState.markAllAsRead(visibleAlerts.map(a => a.metric.id));
  };

  const handleDismissAllRead = () => {
    const readIds = visibleAlerts.filter(a => notifState.isRead(a.metric.id)).map(a => a.metric.id);
    notifState.dismissAll(readIds);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 sm:h-9 sm:w-9 border border-border/50 relative"
          title="Central de Alertas"
        >
          <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {hasAlerts && (
            <span className={cn(
              "absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full text-[9px] sm:text-[10px] flex items-center justify-center font-bold animate-pulse",
              criticalCount > 0 ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"
            )}>
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-3 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-primary" />
              Central de Alertas
            </SheetTitle>
            
            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleMarkAllRead} className="text-xs gap-2">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas como lidas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDismissAllRead} className="text-xs gap-2">
                  <Trash2 className="h-3.5 w-3.5" />
                  Limpar lidas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={notifState.restoreAll} className="text-xs gap-2">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar todas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Summary counts */}
          <div className="flex items-center gap-3 text-[10px] mt-1">
            {criticalCount > 0 && (
              <span className="text-destructive font-medium">{criticalCount} críticos</span>
            )}
            {warningCount > 0 && (
              <span className="text-warning font-medium">{warningCount} atenção</span>
            )}
            <span className="text-success font-medium">{successCount} OK</span>
            {unreadCount > 0 && (
              <span className="text-muted-foreground ml-auto">{unreadCount} não lidas</span>
            )}
          </div>
        </SheetHeader>
        
        {/* Filter tabs */}
        <div className="px-3 py-1.5 bg-muted/30 border-b border-border flex items-center gap-1">
          {(["all", "unread", "read", "critical"] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todas" : f === "unread" ? "Não lidas" : f === "read" ? "Lidas" : "Críticas"}
            </Button>
          ))}
        </div>
        
        {/* Alerts list */}
        <ScrollArea className="h-[calc(100vh-160px)]">
          <div className="divide-y divide-border">
            {filteredAlerts.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-xs">
                {filter === "unread" ? "Todas as notificações foram lidas" : "Nenhum alerta encontrado"}
              </div>
            )}
            {filteredAlerts.map(alert => {
              const isInverse = inverseMetrics.includes(alert.metric.name);
              const isRead = notifState.isRead(alert.metric.id);
              
              return (
                <div 
                  key={alert.metric.id}
                  className={cn(
                    "px-3 py-2.5 transition-colors group relative",
                    isRead ? "opacity-60 bg-muted/10" : "hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Unread dot + severity icon */}
                    <div className="flex-shrink-0 mt-0.5 relative">
                      {!isRead && (
                        <span className="absolute -left-1.5 top-1 h-2 w-2 rounded-full bg-primary" />
                      )}
                      {getSeverityIcon(alert.severity)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("font-medium text-xs truncate", !isRead && "font-semibold")}>
                          {alert.metric.name}
                        </span>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {alert.message}
                      </p>
                    </div>
                    
                    {/* Trend + progress */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {alert.trend !== "unknown" && (
                        <div className="flex items-center gap-0.5">
                          {getTrendIcon(alert.trend, isInverse)}
                          <span className={cn(
                            "text-[10px] font-medium",
                            alert.trend === "up" && (isInverse ? "text-destructive" : "text-success"),
                            alert.trend === "down" && (isInverse ? "text-success" : "text-destructive"),
                            alert.trend === "stable" && "text-muted-foreground"
                          )}>
                            {alert.trendPercent > 0 ? `${formatNumber(alert.trendPercent, 1)}%` : "—"}
                          </span>
                        </div>
                      )}
                      <div className="w-10 text-right">
                        <span className={cn(
                          "text-xs font-bold",
                          alert.severity === "success" && "text-success",
                          alert.severity === "warning" && "text-warning",
                          alert.severity === "critical" && "text-destructive"
                        )}>
                          {formatNumber(alert.progressPercent, 0)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Action buttons - visible on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <TooltipProvider delayDuration={200}>
                        {!isRead && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); notifState.markAsRead(alert.metric.id); }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-[10px]">Marcar como lida</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); notifState.dismiss(alert.metric.id); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-[10px]">Excluir</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  {/* Mini progress bar */}
                  <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden ml-6">
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
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
