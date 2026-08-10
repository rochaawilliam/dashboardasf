import { useState } from "react";
import { cn } from "@/lib/utils";
import { Edit2, Check, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Sparkline } from "./Sparkline";
import { PaceIndicator } from "./PaceIndicator";
import type { Metric, MetricHistory, MonthlyTarget } from "@/hooks/useMetrics";
import { formatMetricValue, formatNumber } from "@/utils/formatters";
import { parseLocalDate } from "@/utils/dateUtils";

interface MetricCardMonthlyProps {
  metric: Metric;
  monthlyValue: number | null;
  isMonthSelected: boolean;
  accumulatedValue: number;
  onSave?: (metricId: string, value: number) => void;
  isSaving?: boolean;
  selectedMonthName?: string;
  historyData?: MetricHistory[];
  selectedYear?: number;
  selectedMonth?: number | null;
  monthlyTargets?: MonthlyTarget[];
  onCardClick?: () => void;
}

const inverseMetrics = ["Churn de Clientes", "Turnover"];

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
  if (unit === "%" || unit.toLowerCase().includes("percent")) {
    return true;
  }
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

const getProgressBorderColor = (progress: number): string => {
  if (progress <= 35) return "#ef4444"; // red-500
  if (progress <= 50) return "#f97316"; // orange-500
  if (progress <= 70) return "#3b82f6"; // blue-500
  if (progress <= 95) return "#06b6d4"; // cyan-500
  return "#10b981"; // emerald-500
};

function calculateTrend(
  metricId: string,
  historyData: MetricHistory[]
): { trend: "up" | "down" | "stable" | "unknown"; percent: number; monthsCount: number } {
  const metricHistory = historyData
    .filter(h => h.metric_id === metricId)
    .sort((a, b) => parseLocalDate(b.recorded_at).getTime() - parseLocalDate(a.recorded_at).getTime());
  
  if (metricHistory.length < 2) {
    return { trend: "unknown", percent: 0, monthsCount: metricHistory.length };
  }
  
  const current = metricHistory[0]?.value ?? 0;
  const previous = metricHistory[1]?.value ?? 0;
  
  if (previous === 0) {
    return { trend: current > 0 ? "up" : "stable", percent: 100, monthsCount: metricHistory.length };
  }
  
  const percentChange = ((current - previous) / Math.abs(previous)) * 100;
  
  if (Math.abs(percentChange) < 1) {
    return { trend: "stable", percent: 0, monthsCount: metricHistory.length };
  }
  
  return {
    trend: percentChange > 0 ? "up" : "down",
    percent: Math.abs(percentChange),
    monthsCount: metricHistory.length
  };
}

export function MetricCardMonthly({ 
  metric, 
  monthlyValue, 
  isMonthSelected,
  accumulatedValue,
  onSave,
  isSaving,
  selectedMonthName,
  historyData = [],
  selectedYear = new Date().getFullYear(),
  selectedMonth,
  monthlyTargets = [],
  onCardClick,
}: MetricCardMonthlyProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingValue, setPendingValue] = useState<number | null>(null);

  const isInverse = inverseMetrics.includes(metric.name);
  const isNonAccumulative = isNonAccumulativeMetric(metric.name, metric.unit);
  
  const { trend, percent: trendPercent, monthsCount } = calculateTrend(metric.id, historyData);
  const hasTrend = trend !== "unknown" && monthsCount >= 2;
  
  // Check if this metric has a specific monthly target for the selected year+month
  const specificMonthlyTarget = selectedMonth 
    ? monthlyTargets.find(mt => mt.metric_id === metric.id && mt.month === selectedMonth && mt.year === selectedYear)
    : null;
  
  const monthlyTarget = specificMonthlyTarget 
    ? specificMonthlyTarget.target_value
    : (isNonAccumulative ? metric.target_value : metric.target_value / 12);
  
  const displayValue = isMonthSelected ? (monthlyValue ?? 0) : accumulatedValue;
  
  // When month selected, always compare against monthly target
  const targetForProgress = isMonthSelected 
    ? monthlyTarget 
    : metric.target_value;
  
  const status = getStatus(displayValue, targetForProgress, isInverse);
  const progress = isInverse 
    ? targetForProgress > 0 && displayValue > 0 
      ? Math.min((targetForProgress / displayValue) * 100, 100) 
      : displayValue === 0 ? 100 : 0
    : targetForProgress > 0 
      ? Math.min((displayValue / targetForProgress) * 100, 100)
      : 0;

  const hasNoData = isMonthSelected && monthlyValue === null;
  
  const isPositiveTrend = isInverse ? trend === "down" : trend === "up";
  const isNegativeTrend = isInverse ? trend === "up" : trend === "down";
  
  const getTrendIcon = () => {
    if (trend === "up") {
      return <TrendingUp className={cn("h-3 w-3", isPositiveTrend ? "text-success" : "text-primary")} />;
    }
    if (trend === "down") {
      return <TrendingDown className={cn("h-3 w-3", isNegativeTrend ? "text-primary" : "text-success")} />;
    }
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

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
      <div 
        className={cn(
          "metric-card group relative p-1.5 sm:p-2 lg:p-2.5 border-l-[3px]",
          status === "danger" && !hasNoData && "ring-1 ring-primary/50",
          onCardClick && !isEditing && "cursor-pointer hover:shadow-md transition-shadow"
        )}
        style={{ borderLeftColor: getProgressBorderColor(progress) }}
        onClick={() => {
          if (onCardClick && !isEditing) onCardClick();
        }}
      >
        {/* Header with name and trend */}
        <div className="flex items-start justify-between gap-1 mb-1 sm:mb-1.5">
          <span className="metric-label line-clamp-2 flex-1">{metric.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            {hasTrend && (
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className={cn(
                      "flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-semibold transition-colors",
                      isPositiveTrend && "bg-success/10 text-success hover:bg-success/20",
                      isNegativeTrend && "bg-primary/10 text-primary hover:bg-primary/20",
                      trend === "stable" && "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {getTrendIcon()}
                    <span>{trendPercent > 0 ? `${formatNumber(trendPercent, 0)}%` : "—"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-2" side="top">
                  <div className="text-xs">
                    <p className="font-semibold">
                      {trend === "up" && "Crescimento"}
                      {trend === "down" && "Queda"}
                      {trend === "stable" && "Estável"}
                    </p>
                    <p className="text-muted-foreground">vs. mês anterior</p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {isMonthSelected && onSave && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                className="h-5 w-5 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Editing mode */}
        {isEditing ? (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-7 text-sm"
                autoFocus
              />
              {metric.unit !== "número" && <span className="text-xs text-muted-foreground">{metric.unit}</span>}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={handleRequestSave}
                disabled={isSaving}
                className="flex-1 h-6 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-6 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Main value and target - compact row layout */}
            <div className="flex items-end justify-between gap-1 mb-1 sm:mb-1.5">
              {/* Current value - prominent */}
              <div className="flex-1 min-w-0">
                {hasNoData ? (
                  <span className="text-muted-foreground text-[7px] sm:text-[8px] italic">Sem dados</span>
                ) : (
                  <div className="text-[10px] sm:text-sm lg:text-lg font-bold leading-none text-primary truncate tracking-tighter">
                    {formatMetricValue(displayValue, metric.unit, metric.name)}
                  </div>
                )}
                <div className="text-[7px] sm:text-[8px] text-muted-foreground mt-0.5">
                  {isMonthSelected ? "Lançado" : "Acumulado"}
                </div>
              </div>
              
              {/* Target - shows monthly when month selected, annual otherwise */}
              <div className="text-right shrink-0">
                {isMonthSelected ? (
                  <>
                     <div className="text-[8px] sm:text-[11px] lg:text-xs font-semibold text-primary truncate tracking-tighter">
                      {formatMetricValue(monthlyTarget, metric.unit, metric.name)}
                    </div>
                    <div className="text-[7px] sm:text-[8px] text-muted-foreground">
                      Meta Mensal{specificMonthlyTarget ? "" : " ≈"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[8px] sm:text-[11px] lg:text-xs font-semibold text-primary truncate tracking-tighter">
                      {formatMetricValue(metric.target_value, metric.unit, metric.name)}
                    </div>
                    <div className="text-[7px] sm:text-[8px] text-muted-foreground">
                      Meta {isNonAccumulative ? "" : "Anual"}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Annual target reference when month is selected */}
            {isMonthSelected && !isNonAccumulative && (
              <div className="text-[7px] sm:text-[8px] text-muted-foreground mb-1 sm:mb-1.5 flex items-center gap-1">
                <span>Meta anual:</span>
                <span className="font-medium">{formatMetricValue(metric.target_value, metric.unit, metric.name)}</span>
              </div>
            )}
            
            {/* Compact Progress bar */}
            <div className="space-y-0.5">
              <div className="progress-bar h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    hasNoData ? "bg-muted" : getStatusColor(status)
                  )}
                  style={{ width: `${hasNoData ? 0 : progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-medium text-primary">
                  {hasNoData ? "—" : `${formatNumber(progress, 0)}%`}
                </span>
              </div>
            </div>
            
            {/* Sparkline + Pace Indicator - two columns */}
            <div className="flex items-stretch gap-1 lg:gap-1.5 mt-1">
              <Sparkline
                metricId={metric.id}
                metricName={metric.name}
                unit={metric.unit}
                historyData={historyData}
                selectedYear={selectedYear}
                height={32}
                className="flex-1 min-w-0"
              />
              <PaceIndicator
                metricId={metric.id}
                metricName={metric.name}
                unit={metric.unit}
                annualTarget={metric.target_value}
                historyData={historyData}
                selectedYear={selectedYear}
                isInverse={isInverse}
                isNonAccumulative={isNonAccumulative}
                className="w-10 lg:w-12 shrink-0"
              />
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmar Lançamento</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Salvar <strong>{pendingValue !== null ? formatMetricValue(pendingValue, metric.unit, metric.name) : ""}</strong> para <strong>{metric.name}</strong>
              {selectedMonthName && <> em <strong>{selectedMonthName}</strong></>}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel onClick={handleCancelConfirm} className="flex-1 h-8 text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} disabled={isSaving} className="flex-1 h-8 text-xs">
              {isSaving ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
