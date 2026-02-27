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

// 5 segment colors for each 20% band
const SEGMENT_COLORS = [
  "hsl(0, 75%, 48%)",      // 0-20%: Red
  "hsl(25, 85%, 50%)",     // 20-40%: Orange
  "hsl(40, 80%, 48%)",     // 40-60%: Amber
  "hsl(80, 65%, 42%)",     // 60-80%: Yellow-green
  "hsl(142, 65%, 38%)",    // 80-100%: Green
];

const getColorForPercentage = (percentage: number): string => {
  if (percentage <= 20) return SEGMENT_COLORS[0];
  if (percentage <= 40) return SEGMENT_COLORS[1];
  if (percentage <= 60) return SEGMENT_COLORS[2];
  if (percentage <= 80) return SEGMENT_COLORS[3];
  return SEGMENT_COLORS[4];
};

function CircularProgress({ 
  percentage, 
  size = 90, 
  strokeWidth = 7, 
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number; 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(percentage, 0), 100);

  // Build segments: each 20% band gets its own color
  const segments: { start: number; end: number; color: string }[] = [];
  const bands = [0, 20, 40, 60, 80, 100];
  for (let i = 0; i < 5; i++) {
    const bandStart = bands[i];
    const bandEnd = bands[i + 1];
    if (clampedPct <= bandStart) break;
    segments.push({
      start: bandStart,
      end: Math.min(clampedPct, bandEnd),
      color: SEGMENT_COLORS[i],
    });
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted) / 0.5)"
          strokeWidth={strokeWidth}
        />
        {/* Multi-color progress segments */}
        {segments.map((seg, i) => {
          const segLength = ((seg.end - seg.start) / 100) * circumference;
          const segOffset = circumference - (seg.start / 100) * circumference;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segLength} ${circumference - segLength}`}
              strokeDashoffset={segOffset}
              strokeLinecap={i === segments.length - 1 ? "round" : "butt"}
              className="transition-all duration-700 ease-out"
            />
          );
        })}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg sm:text-xl font-bold text-foreground leading-none">
          {formatNumber(clampedPct, 1)}%
        </span>
        <span className="text-[7px] sm:text-[8px] text-muted-foreground mt-0.5">
          {clampedPct >= 100 ? "Atingido" : "Meta Pontual"}
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
            <div className="flex items-center justify-center" style={{ width: 90, height: 90 }}>
              <span className="text-muted-foreground text-xs italic">Sem dados</span>
            </div>
          ) : (
            <CircularProgress percentage={progress} size={90} strokeWidth={7} />
          )}
        </div>

        {/* Target and Realized values */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          {/* Realized - prominent */}
          <div>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide">
              {isMonthSelected ? "Realizado" : "Acumulado"}
            </p>
            <p className="text-xl sm:text-2xl font-extrabold leading-tight" style={{ color: getColorForPercentage(progress) }}>
              {hasNoData ? "—" : formatMetricValue(displayValue, metric.unit, metric.name)}
            </p>
          </div>

          {/* Target - secondary */}
          <div>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide">
              {isMonthSelected ? `Meta ${selectedMonthName || "Mensal"}` : (isNonAccumulative ? "Meta" : "Meta Anual")}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground leading-tight">
              {isMonthSelected
                ? formatMetricValue(monthlyTarget, metric.unit, metric.name)
                : formatMetricValue(metric.target_value, metric.unit, metric.name)}
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
