import React from "react";
import { cn } from "@/lib/utils";
import { formatMetricValue, formatNumber } from "@/utils/formatters";
import { Sparkline } from "./Sparkline";
import { PaceIndicator } from "./PaceIndicator";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger } from
"@/components/ui/tooltip";
import { useUpdateMetric } from "@/hooks/useMetrics";
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

const nonAccumulativeKeywords = [
"Ticket Médio", "Margem", "Churn", "Custo Fixo", "Folha sobre Receita",
"Inadimplência", "Cumprimento do Orçamento", "Lead Time", "SLA", "NPS",
"ENPS", "Taxa", "Turnover", "LTV", "Upsell"];


function isNonAccumulativeMetric(name: string, unit: string): boolean {
  if (unit === "%" || unit.toLowerCase().includes("percent")) return true;
  return nonAccumulativeKeywords.some((k) => name.toLowerCase().includes(k.toLowerCase()));
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

// HSL values for each band boundary
const BAND_HSL = [
[0, 75, 48], // Red
[25, 85, 50], // Orange
[40, 80, 48], // Amber
[80, 65, 42], // Yellow-green
[142, 65, 38] // Green
];

const SEGMENT_COLORS = BAND_HSL.map(([h, s, l]) => `hsl(${h}, ${s}%, ${l}%)`);

function interpolateHSL(
h1: number, s1: number, l1: number,
h2: number, s2: number, l2: number,
t: number)
: string {
  const h = h1 + (h2 - h1) * t;
  const s = s1 + (s2 - s1) * t;
  const l = l1 + (l2 - l1) * t;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function getInterpolatedColor(pct: number): string {
  if (pct <= 0) return SEGMENT_COLORS[0];
  if (pct >= 100) return SEGMENT_COLORS[4];
  const bandIndex = Math.min(Math.floor(pct / 20), 4);
  const nextIndex = Math.min(bandIndex + 1, 4);
  const t = (pct - bandIndex * 20) / 20;
  const [h1, s1, l1] = BAND_HSL[bandIndex];
  const [h2, s2, l2] = BAND_HSL[nextIndex];
  return interpolateHSL(h1, s1, l1, h2, s2, l2, t);
}

function CircularProgress({
  percentage,
  size = 110,
  strokeWidth = 8




}: {percentage: number;size?: number;strokeWidth?: number;}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(percentage, 0), 100);
  const [animated, setAnimated] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const currentPct = animated ? clampedPct : 0;

  const GRADIENT_STEPS = 60;
  const stepSize = currentPct / GRADIENT_STEPS;
  const gradientSegments: {start: number;end: number;color: string;}[] = [];
  for (let i = 0; i < GRADIENT_STEPS; i++) {
    const start = i * stepSize;
    const end = (i + 1) * stepSize;
    if (end <= 0) continue;
    const midPct = (start + end) / 2;
    gradientSegments.push({ start, end, color: getInterpolatedColor(midPct) });
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted) / 0.5)"
          strokeWidth={strokeWidth} />

        {gradientSegments.map((seg, i) => {
          const segLength = (seg.end - seg.start) / 100 * circumference;
          const segOffset = circumference - seg.start / 100 * circumference;
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
              strokeLinecap={i === gradientSegments.length - 1 ? "round" : "butt"}
              style={{ transition: `stroke-dasharray 1s ease-out ${i * 8}ms, stroke-dashoffset 1s ease-out ${i * 8}ms` }} />);


        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl sm:text-2xl text-foreground leading-none font-extrabold font-serif">
          {formatNumber(animated ? clampedPct : 0, 1)}%
        </span>
        <span className="text-[7px] sm:text-[8px] text-muted-foreground mt-0.5">
          {clampedPct >= 100 ? "Atingido" : "Meta Pontual"}
        </span>
      </div>
    </div>);

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
  onCardClick
}: CircularProgressCardProps) {
  const isInverse = metric.polarity === "lower_is_better";
  const isNonAccumulative = isNonAccumulativeMetric(metric.name, metric.unit);
  const updateMetric = useUpdateMetric();

  const handleTogglePolarity = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPolarity = isInverse ? "higher_is_better" : "lower_is_better";
    updateMetric.mutate({ id: metric.id, polarity: newPolarity });
  };

  const specificMonthlyTarget = selectedMonth ?
  monthlyTargets.find((mt) => mt.metric_id === metric.id && mt.month === selectedMonth && mt.year === selectedYear) :
  null;

  const monthlyTarget = specificMonthlyTarget ?
  specificMonthlyTarget.target_value :
  isNonAccumulative ? metric.target_value : metric.target_value / 12;

  const displayValue = isMonthSelected ? monthlyValue ?? 0 : accumulatedValue;
  const targetForProgress = isMonthSelected ? monthlyTarget : metric.target_value;

  const status = getStatus(displayValue, targetForProgress, isInverse);
  const progress = isInverse ?
  targetForProgress > 0 && displayValue > 0 ?
  Math.min(targetForProgress / displayValue * 100, 100) :
  displayValue === 0 ? 100 : 0 :
  targetForProgress > 0 ?
  Math.min(displayValue / targetForProgress * 100, 100) :
  0;

  const hasNoData = isMonthSelected && monthlyValue === null;

  return (
    <div
      className={cn(
        "metric-card group relative p-3 sm:p-4",
        onCardClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
      onClick={() => onCardClick?.()}>

      {/* Header with polarity toggle */}
      <div className="mb-2 sm:mb-3 flex items-center gap-1.5">
        <span className="metric-label text-[10px] sm:text-xs font-semibold flex-1">{metric.name}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleTogglePolarity}
              className={cn(
                "shrink-0 p-0.5 rounded-full transition-colors hover:bg-muted/80",
                updateMetric.isPending && "opacity-50 pointer-events-none"
              )}
              aria-label="Alternar polaridade da meta">

              {isInverse ?
              <ArrowDownCircle className="w-4 h-4 text-success" /> :

              <ArrowUpCircle className="w-4 h-4 text-primary" />
              }
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {isInverse ? "Quanto menor, melhor — clique para alternar" : "Quanto maior, melhor — clique para alternar"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main content: 1/3 chart + 2/3 info */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Circular Progress - 1/3 */}
        <div className="shrink-0 w-1/3 flex items-center justify-center">
          {hasNoData ?
          <div className="flex items-center justify-center" style={{ width: 110, height: 110 }}>
              <span className="text-muted-foreground text-xs italic">Sem dados</span>
            </div> :

          <CircularProgress percentage={progress} size={110} strokeWidth={8} />
          }
        </div>

        {/* Target and Realized values - 2/3 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
          {/* Target - top */}
          <div>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide">
              {isMonthSelected ? `Meta ${selectedMonthName || "Mensal"}` : isNonAccumulative ? "Meta" : "Meta Anual"}
            </p>
            <p className="text-base font-semibold text-foreground leading-tight sm:text-2xl">
              {isMonthSelected ?
              formatMetricValue(monthlyTarget, metric.unit, metric.name) :
              formatMetricValue(metric.target_value, metric.unit, metric.name)}
            </p>
          </div>

          {/* Realized - bottom */}
          <div>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wide">
              {isMonthSelected ? "Realizado" : "Acumulado"}
            </p>
            <p className="text-base font-bold text-foreground leading-tight sm:text-3xl">
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
          className="flex-1 min-w-0" />

        <PaceIndicator
          metricId={metric.id}
          metricName={metric.name}
          unit={metric.unit}
          annualTarget={metric.target_value}
          historyData={historyData}
          selectedYear={selectedYear}
          isInverse={isInverse}
          isNonAccumulative={isNonAccumulative}
          className="w-12 shrink-0" />

      </div>

      {/* Annual target reference when month is selected */}
      {isMonthSelected && !isNonAccumulative &&
      <div className="text-[7px] sm:text-[8px] text-muted-foreground mt-1.5 flex items-center gap-1">
          <span>Meta anual:</span>
          <span className="font-medium">{formatMetricValue(metric.target_value, metric.unit, metric.name)}</span>
        </div>
      }
    </div>);

}