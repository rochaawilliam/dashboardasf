import { cn } from "@/lib/utils";
import { formatMetricValue, formatNumber } from "@/utils/formatters";
import { Sparkline } from "./Sparkline";
import { PaceIndicator } from "./PaceIndicator";
import type { Metric, MetricHistory, MonthlyTarget } from "@/hooks/useMetrics";

interface CircularProgressCardProps {
  metric: Metric;
  monthlyValue: number | null;
  isMonthSelected: boolean;
  accumulatedValue: number;
  selectedMonthName?: string;
  historyData?: MetricHistory[];
  selectedYear?: number;
  selectedMonth?: number | null;
  monthlyTargets?: MonthlyTarget[];
  onCardClick?: () => void;
}

const inverseMetrics = ["Churn de Clientes", "Turnover"];

const nonAccumulativeKeywords = [
  "Ticket Médio", "Margem", "Churn", "Custo Fixo", "Folha sobre Receita",
  "Inadimplência", "Cumprimento do Orçamento", "Lead Time", "SLA", "NPS",
  "ENPS", "Taxa", "Turnover", "LTV", "Upsell",
];

function isNonAccumulativeMetric(name: string, unit: string): boolean {
  if (unit === "%" || unit.toLowerCase().includes("percent")) return true;
  return nonAccumulativeKeywords.some(k => name.toLowerCase().includes(k.toLowerCase()));
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

const getStatusStrokeColor = (status: "success" | "warning" | "danger") => {
  switch (status) {
    case "success": return "hsl(var(--success))";
    case "warning": return "hsl(var(--warning))";
    case "danger": return "hsl(var(--destructive))";
  }
};

const getStatusTrackColor = (status: "success" | "warning" | "danger") => {
  switch (status) {
    case "success": return "hsl(var(--success) / 0.15)";
    case "warning": return "hsl(var(--warning) / 0.15)";
    case "danger": return "hsl(var(--destructive) / 0.15)";
  }
};

function CircularProgress({ 
  percentage, 
  size = 100, 
  strokeWidth = 8, 
  status 
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number; 
  status: "success" | "warning" | "danger";
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStatusTrackColor(status)}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStatusStrokeColor(status)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg sm:text-xl font-bold text-foreground leading-none">
          {formatNumber(percentage, 1)}%
        </span>
        <span className="text-[7px] sm:text-[8px] text-muted-foreground mt-0.5">
          {percentage >= 100 ? "Atingido" : "Meta Pontual"}
        </span>
      </div>
    </div>
  );
}

export function CircularProgressCard({
  metric,
  monthlyValue,
  isMonthSelected,
  accumulatedValue,
  selectedMonthName,
  historyData = [],
  selectedYear = new Date().getFullYear(),
  selectedMonth,
  monthlyTargets = [],
  onCardClick,
}: CircularProgressCardProps) {
  const isInverse = inverseMetrics.includes(metric.name);
  const isNonAccumulative = isNonAccumulativeMetric(metric.name, metric.unit);

  const specificMonthlyTarget = selectedMonth
    ? monthlyTargets.find(mt => mt.metric_id === metric.id && mt.month === selectedMonth && mt.year === selectedYear)
    : null;

  const monthlyTarget = specificMonthlyTarget
    ? specificMonthlyTarget.target_value
    : (isNonAccumulative ? metric.target_value : metric.target_value / 12);

  const displayValue = isMonthSelected ? (monthlyValue ?? 0) : accumulatedValue;

  const targetForProgress = isMonthSelected ? monthlyTarget : metric.target_value;

  const status = getStatus(displayValue, targetForProgress, isInverse);
  const progress = isInverse
    ? targetForProgress > 0 && displayValue > 0
      ? Math.min((targetForProgress / displayValue) * 100, 100)
      : displayValue === 0 ? 100 : 0
    : targetForProgress > 0
      ? Math.min((displayValue / targetForProgress) * 100, 100)
      : 0;

  const hasNoData = isMonthSelected && monthlyValue === null;

  return (
    <div
      className={cn(
        "metric-card group relative p-3 sm:p-4",
        onCardClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
      onClick={() => onCardClick?.()}
    >
      {/* Header */}
      <div className="mb-2 sm:mb-3">
        <span className="metric-label text-[10px] sm:text-xs font-semibold">{metric.name}</span>
      </div>

      {/* Main content: circular progress + values */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Circular Progress */}
        <div className="shrink-0">
          {hasNoData ? (
            <div className="flex items-center justify-center" style={{ width: 100, height: 100 }}>
              <span className="text-muted-foreground text-xs italic">Sem dados</span>
            </div>
          ) : (
            <CircularProgress percentage={progress} size={100} strokeWidth={8} status={status} />
          )}
        </div>

        {/* Target and Realized values */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Target */}
          <div>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">
              {isMonthSelected ? `Meta ${selectedMonthName || "Mensal"}` : (isNonAccumulative ? "Meta" : "Meta Anual")}
            </p>
            <p className="text-sm sm:text-base font-bold text-foreground leading-tight">
              {isMonthSelected
                ? formatMetricValue(monthlyTarget, metric.unit, metric.name)
                : formatMetricValue(metric.target_value, metric.unit, metric.name)}
            </p>
          </div>

          {/* Realized */}
          <div>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">
              {isMonthSelected ? "Realizado" : "Acumulado"}
            </p>
            <p className={cn(
              "text-sm sm:text-base font-bold leading-tight",
              status === "success" ? "text-success" : status === "warning" ? "text-warning" : "text-destructive"
            )}>
              {hasNoData ? "—" : formatMetricValue(displayValue, metric.unit, metric.name)}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom section: Sparkline + Pace */}
      <div className="flex items-stretch gap-1.5 mt-3">
        <Sparkline
          metricId={metric.id}
          metricName={metric.name}
          unit={metric.unit}
          historyData={historyData}
          selectedYear={selectedYear}
          height={40}
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
          className="w-12 shrink-0"
        />
      </div>

      {/* Annual target reference when month is selected */}
      {isMonthSelected && !isNonAccumulative && (
        <div className="text-[7px] sm:text-[8px] text-muted-foreground mt-1.5 flex items-center gap-1">
          <span>Meta anual:</span>
          <span className="font-medium">{formatMetricValue(metric.target_value, metric.unit, metric.name)}</span>
        </div>
      )}
    </div>
  );
}
