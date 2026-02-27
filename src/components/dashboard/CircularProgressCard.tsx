import React from "react";
import { cn } from "@/lib/utils";
import { formatMetricValue, formatNumber } from "@/utils/formatters";
import { Sparkline } from "./Sparkline";
import { PaceIndicator } from "./PaceIndicator";
import { ArrowUpCircle, ArrowDownCircle, Trophy, Rocket, Flame, Zap, TrendingUp, PlayCircle, Flag, Timer, PersonStanding, Target, Crosshair } from "lucide-react";
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
  rawPercentage,
  size = 110,
  strokeWidth = 8
}: {percentage: number;rawPercentage?: number;size?: number;strokeWidth?: number;}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(percentage, 0), 100);
  const displayPct = rawPercentage ?? percentage;
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
          const rawSegLength = (seg.end - seg.start) / 100 * circumference;
          const segLength = rawSegLength + 1.5; // overlap to eliminate gaps
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
        <span className="text-foreground leading-none font-sans text-center sm:text-3xl font-bold text-3xl">
          {formatNumber(animated ? Math.max(displayPct, 0) : 0, 0)}%
        </span>
        <span className="sm:text-[8px] text-muted-foreground mt-0.5 text-sm">
          {displayPct >= 100 ? "Atingido" : "Meta Pontual"}
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
  const rawProgress = isInverse ?
  targetForProgress > 0 && displayValue > 0 ?
  targetForProgress / displayValue * 100 :
  displayValue === 0 ? 100 : 0 :
  targetForProgress > 0 ?
  displayValue / targetForProgress * 100 :
  0;
  const progress = Math.min(rawProgress, 100);

  const hasNoData = false; // Always show 0% when no data

  return (
    <div
      className={cn(
        "metric-card group relative p-3 sm:p-4",
        onCardClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
      onClick={() => onCardClick?.()}>

      {/* Header with polarity toggle */}
      <div className="mb-2 sm:mb-3 flex items-center gap-1.5">
        <span className="metric-label sm:text-xs font-semibold flex-1 text-base">{metric.name}</span>
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

      {/* Achievement Badge + Guerrilla Icon */}
      {(() => {
        const now = new Date();
        const isCurrentMonth = !isMonthSelected || selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
        const isPastMonth = isMonthSelected && !isCurrentMonth;

        const p = rawProgress;

        // For past months, only show badge if >= 100%
        if (isPastMonth && p < 100) return null;

        let badge: {label: string;icon: React.ReactNode;className: string;} | null = null;

        if (p >= 120) {
          badge = { label: "Aceleramos!", icon: <Rocket className="w-3 h-3" />, className: "bg-destructive/15 text-destructive" };
        } else if (p >= 100) {
          badge = { label: "Meta Batida!", icon: <Trophy className="w-3 h-3" />, className: "bg-success/15 text-success" };
        } else if (p >= 80) {
          badge = { label: "Reta Final!", icon: <Flag className="w-3 h-3" />, className: "bg-primary/15 text-primary" };
        } else if (p >= 60) {
          badge = { label: "Go! Go!", icon: <Zap className="w-3 h-3" />, className: "bg-accent/30 text-accent-foreground" };
        } else if (p >= 40) {
          badge = { label: "Mantenha o ritmo!", icon: <TrendingUp className="w-3 h-3" />, className: "bg-warning/15 text-warning" };
        } else if (p >= 20) {
          badge = { label: "Vamos nessa!", icon: <Flame className="w-3 h-3" />, className: "bg-warning/25 text-warning" };
        } else {
          badge = { label: "Começamos!", icon: <PlayCircle className="w-3 h-3" />, className: "bg-muted text-muted-foreground" };
        }

        // Guerrilla icon only for current month
        const showGuerrilla = isCurrentMonth;
        let guerrillaIcon: React.ReactNode = null;
        let guerrillaTooltip = "";
        if (showGuerrilla) {
          const day = now.getDate();
          if (day <= 10) {
            guerrillaIcon = <Timer className="w-3.5 h-3.5 text-primary" />;
            guerrillaTooltip = "Largada do mês";
          } else if (day <= 20) {
            guerrillaIcon = <PersonStanding className="w-3.5 h-3.5 text-accent-foreground" />;
            guerrillaTooltip = "Corrida em andamento";
          } else if (day <= 25) {
            guerrillaIcon = <Rocket className="w-3.5 h-3.5 text-warning" />;
            guerrillaTooltip = "Aceleração final";
          } else {
            guerrillaIcon = <Crosshair className="w-3.5 h-3.5 text-destructive" />;
            guerrillaTooltip = "Foco no alvo";
          }
        }

        return (
          <div className="mb-2 flex items-center justify-end gap-[4px]">
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold", badge.className)}>
              {badge.icon}
              {badge.label}
            </span>
            {showGuerrilla && guerrillaIcon &&
            <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center p-0.5 rounded-full bg-muted/50">
                    {guerrillaIcon}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">{guerrillaTooltip}</TooltipContent>
              </Tooltip>
            }
          </div>);

      })()}

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Circular Progress - 1/3 */}
        <div className="shrink-0 w-1/3 flex items-center justify-center">
          <CircularProgress percentage={progress} rawPercentage={rawProgress} size={110} strokeWidth={12} />
        </div>

        {/* Target and Realized values - 2/3 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-[4px]">
          {/* Target - top */}
          <div>
            <p className="sm:text-[9px] text-muted-foreground uppercase tracking-wide text-sm">
              {isMonthSelected ? `Meta ${selectedMonthName || "Mensal"}` : isNonAccumulative ? "Meta" : "Meta Anual"}
            </p>
            <p className="font-semibold text-foreground leading-tight sm:text-3xl text-2xl">
              {isMonthSelected ?
              formatMetricValue(monthlyTarget, metric.unit, metric.name) :
              formatMetricValue(metric.target_value, metric.unit, metric.name)}
            </p>
          </div>

          {/* Realized - bottom */}
          <div>
            <p className="sm:text-[9px] text-muted-foreground uppercase tracking-wide text-sm">
              {isMonthSelected ? "Realizado" : "Acumulado"}
            </p>
            <p className="text-foreground leading-tight sm:text-4xl font-extrabold text-3xl">
              {formatMetricValue(displayValue, metric.unit, metric.name)}
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