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
import type { Metric, MetricHistory } from "@/hooks/useMetrics";
import { formatMetricValue, formatNumber } from "@/utils/formatters";
import { parseISO } from "date-fns";

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
}

const inverseMetrics = ["Churn de Clientes", "Turnover"];

// Metrics where annual target = monthly target (averages, rates, percentages)
// These are metrics that don't accumulate over time
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
  // Check if unit is percentage
  if (unit === "%" || unit.toLowerCase().includes("percent")) {
    return true;
  }
  // Check if name contains any non-accumulative keyword
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

// Calculate trend from history
function calculateTrend(
  metricId: string,
  historyData: MetricHistory[]
): { trend: "up" | "down" | "stable" | "unknown"; percent: number; monthsCount: number } {
  const metricHistory = historyData
    .filter(h => h.metric_id === metricId)
    .sort((a, b) => parseISO(b.recorded_at).getTime() - parseISO(a.recorded_at).getTime());
  
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
}: MetricCardMonthlyProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingValue, setPendingValue] = useState<number | null>(null);

  const isInverse = inverseMetrics.includes(metric.name);
  const isNonAccumulative = isNonAccumulativeMetric(metric.name, metric.unit);
  
  // Calculate trend
  const { trend, percent: trendPercent, monthsCount } = calculateTrend(metric.id, historyData);
  const hasTrend = trend !== "unknown" && monthsCount >= 2;
  
  // For non-accumulative metrics, monthly target = annual target
  // For accumulative metrics, monthly target = annual target / 12
  const monthlyTarget = isNonAccumulative ? metric.target_value : metric.target_value / 12;
  
  // For non-accumulative metrics: use average instead of sum
  // For display: use monthlyValue if month selected, otherwise calculate appropriately
  const displayValue = isMonthSelected ? (monthlyValue ?? 0) : accumulatedValue;
  
  // For non-accumulative metrics, target is always the same (monthly = annual)
  const targetForProgress = isNonAccumulative 
    ? metric.target_value 
    : (isMonthSelected ? monthlyTarget : metric.target_value);
  
  const status = getStatus(displayValue, targetForProgress, isInverse);
  const progress = isInverse 
    ? targetForProgress > 0 && displayValue > 0 
      ? Math.min((targetForProgress / displayValue) * 100, 100) 
      : displayValue === 0 ? 100 : 0
    : targetForProgress > 0 
      ? Math.min((displayValue / targetForProgress) * 100, 100)
      : 0;

  const hasNoData = isMonthSelected && monthlyValue === null;
  
  // Trend styling
  const isPositiveTrend = isInverse ? trend === "down" : trend === "up";
  const isNegativeTrend = isInverse ? trend === "up" : trend === "down";
  
  const getTrendIcon = () => {
    if (trend === "up") {
      return <TrendingUp className={cn("h-3 w-3", isPositiveTrend ? "text-success" : "text-destructive")} />;
    }
    if (trend === "down") {
      return <TrendingDown className={cn("h-3 w-3", isNegativeTrend ? "text-destructive" : "text-success")} />;
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
      <div className={cn(
        "metric-card group relative",
        status === "danger" && !hasNoData && "ring-2 ring-destructive/50"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <span className="metric-label text-sm font-medium line-clamp-2">{metric.name}</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {/* Trend indicator */}
            {hasTrend && (
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className={cn(
                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors",
                      isPositiveTrend && "bg-success/10 text-success hover:bg-success/20",
                      isNegativeTrend && "bg-destructive/10 text-destructive hover:bg-destructive/20",
                      trend === "stable" && "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {getTrendIcon()}
                    <span>{trendPercent > 0 ? `${formatNumber(trendPercent, 0)}%` : "—"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2" side="top">
                  <div className="text-xs">
                    <p className="font-medium">
                      {trend === "up" && "Crescimento"}
                      {trend === "down" && "Queda"}
                      {trend === "stable" && "Estável"}
                    </p>
                    <p className="text-muted-foreground">vs. período anterior</p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {isMonthSelected && onSave && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartEdit}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
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
                onClick={handleRequestSave}
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
            {/* Annual target (main goal) */}
            <div className="mb-3 p-2 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">
                🎯 Meta {isNonAccumulative ? "(Mensal = Anual)" : "Anual (Objetivo)"}
              </div>
              <div className="text-lg font-bold">
                {formatMetricValue(metric.target_value, metric.unit, metric.name)}
              </div>
            </div>
            
            {/* Monthly target (progress reference) - only show if accumulative */}
            {!isNonAccumulative && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">
                  📊 Meta Mensal (Referência)
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {formatMetricValue(monthlyTarget, metric.unit, metric.name)}
                </div>
              </div>
            )}
            
            {/* Current value */}
            {hasNoData ? (
              <div className="text-center py-2 mb-3">
                <span className="text-muted-foreground text-sm italic">Sem lançamento</span>
              </div>
            ) : (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">
                  {isMonthSelected ? "📝 Valor Lançado" : "📈 Acumulado no Ano"}
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  status === "success" && "text-success",
                  status === "warning" && "text-warning",
                  status === "danger" && "text-destructive"
                )}>
                  {formatMetricValue(displayValue, metric.unit, metric.name)}
                </div>
              </div>
            )}
            
            {/* Sparkline - Historical Evolution */}
            <div className="mb-3 p-2 rounded-lg bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">📊 Evolução</div>
              <Sparkline
                metricId={metric.id}
                metricName={metric.name}
                unit={metric.unit}
                historyData={historyData}
                selectedYear={selectedYear}
                height={40}
              />
            </div>
            
            {/* Progress bar - shows progress toward annual goal */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso para meta anual</span>
              </div>
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
                  {hasNoData ? "—" : `${formatNumber(progress, 0)}%`}
                </span>
                <span>100%</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a salvar o valor <strong>{pendingValue !== null ? formatMetricValue(pendingValue, metric.unit, metric.name) : ""}</strong> para a métrica <strong>{metric.name}</strong>
              {selectedMonthName && <> em <strong>{selectedMonthName}</strong></>}.
              <br /><br />
              Deseja confirmar este lançamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirm}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
