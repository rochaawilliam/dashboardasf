import React from "react";
import { cn } from "@/lib/utils";
import { formatMetricValue, formatNumber } from "@/utils/formatters";
import { ArrowUpCircle, ArrowDownCircle, Trophy, Rocket, Flame, Zap, TrendingUp, PlayCircle, Flag, Timer, PersonStanding, Target, Crosshair, Info, Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger } from
"@/components/ui/tooltip";
import { useUpdateMetric } from "@/hooks/useMetrics";
import type { Metric, MetricHistory, MonthlyTarget } from "@/hooks/useMetrics";
import { getRefMonthYear } from "@/utils/dateUtils";

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
  monthlyTargetOverride?: number | null;
  onCardClick?: () => void;
  hideTarget?: boolean;
  forecastValue?: number | null;
  hideValues?: boolean;
  forceAnnualLabel?: boolean;
  hideAnnualTarget?: boolean;
  resultadoData?: {
    previsto: number;
    realizado: number;
    resultado: number;
  } | null;
  children?: React.ReactNode;
  /** rendered as a compact second column beside the meta/realizado block */
  sideContent?: React.ReactNode;
  pipelineCardNames?: string[];
  dataSourceBadge?: {
    source: "Operacional" | "Dashboard";
    filter: "created_at" | "month";
    formula?: string;
    calculation?: string;
  };
  isComputedCard?: boolean;
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

// Extract stage label from metric name with singular/plural support
function getStageLabel(name: string, value: number): string | null {
  const lower = name.toLowerCase();
  const singular = Math.abs(value) === 1;
  if (lower.startsWith("prospect")) return singular ? "Prospect" : "Prospects";
  if (lower.startsWith("lead") && !lower.includes("lead time")) return singular ? "Lead" : "Leads";
  if (lower.startsWith("reuni")) return singular ? "Reunião" : "Reuniões";
  if (lower.startsWith("proposta")) return singular ? "Proposta" : "Propostas";
  if (lower.startsWith("novos contrato") || lower.startsWith("contrato")) return singular ? "Contrato" : "Contratos";
  if (lower.startsWith("impress")) return singular ? "Impressão" : "Impressões";
  if (lower.startsWith("conversa")) return singular ? "Conversa" : "Conversas";
  return null;
}

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
  size = 80,
  strokeWidth = 7,
  hideValues = false
}: {percentage: number;rawPercentage?: number;size?: number;strokeWidth?: number;hideValues?: boolean;}) {
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
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[2px] py-[2px] mx-[2px] my-[2px]">
        <span className="text-foreground leading-none font-sans text-center text-xl sm:text-xl lg:text-3xl font-bold tracking-tighter">
          {hideValues ? "•••" : `${formatNumber(animated ? Math.max(displayPct, 0) : 0, 0)}%`}
        </span>
        <span className="text-muted-foreground mt-0 text-[9px] sm:text-[10px] lg:text-sm">
          Meta
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
  monthlyTargetOverride,
  onCardClick,
  hideTarget = false,
  forecastValue,
  hideValues = false,
  forceAnnualLabel = false,
  hideAnnualTarget = false,
  resultadoData,
  children,
  sideContent,
  pipelineCardNames,
  dataSourceBadge,
  isComputedCard
}: CircularProgressCardProps) {
  const isInverse = metric.polarity === "lower_is_better";
  const isNonAccumulative = isNonAccumulativeMetric(metric.name, metric.unit);
  const updateMetric = useUpdateMetric();

  const handleTogglePolarity = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPolarity = isInverse ? "higher_is_better" : "lower_is_better";
    updateMetric.mutate({ id: metric.id, polarity: newPolarity });
  };

  const specificMonthlyTarget = monthlyTargetOverride != null ? { target_value: monthlyTargetOverride } :
  selectedMonth ?
  monthlyTargets.find((mt) => mt.metric_id === metric.id && mt.month === selectedMonth && mt.year === selectedYear) :
  null;

  const monthlyTarget = specificMonthlyTarget ?
  specificMonthlyTarget.target_value :
  isNonAccumulative ? metric.target_value : metric.target_value / 12;

  // Annual target = sum of monthly targets (average for percentage / non-accumulative metrics)
  const annualTarget = React.useMemo(() => {
    const rows = monthlyTargets.filter((mt) => mt.metric_id === metric.id && mt.year === selectedYear);
    if (rows.length === 0) return metric.target_value;
    const sum = rows.reduce((s, t) => s + Number(t.target_value || 0), 0);
    return isNonAccumulative ? sum / rows.length : sum;
  }, [monthlyTargets, metric.id, metric.target_value, selectedYear, isNonAccumulative]);

  // Annual realized value: sum of months, or average of months for percentage metrics
  const annualValue = React.useMemo(() => {
    if (!isNonAccumulative) return accumulatedValue;
    const byMonth: Record<number, number> = {};
    (historyData || []).forEach((h: any) => {
      if (h.metric_id !== metric.id) return;
      if (h.source === "forecast") return;
      const ref = getRefMonthYear(h.period_type, h.recorded_at);
      if (ref.year !== selectedYear) return;
      byMonth[ref.month] = (byMonth[ref.month] || 0) + Number(h.value || 0);
    });
    const months = Object.values(byMonth);
    if (months.length === 0) return accumulatedValue;
    return months.reduce((s, v) => s + v, 0) / months.length;
  }, [isNonAccumulative, historyData, metric.id, selectedYear, accumulatedValue]);

  const displayValue = isMonthSelected ? monthlyValue ?? 0 : annualValue;
  const targetForProgress = isMonthSelected ? monthlyTarget : annualTarget;

  const status = getStatus(displayValue, targetForProgress, isInverse);
  
  // Progress calculation for Receita Bruta Operacional per user request:
  // Use displayValue (realized) / targetForProgress (monthly target) * 100
  const isReceitaTotalMetric = metric.id === "b94952b3-b811-4200-872e-810b215240f6";
  
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
      className={cn("metric-card group relative p-2 sm:p-4 lg:p-4 h-full flex flex-col",

      onCardClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
      onClick={() => onCardClick?.()}>

      {/* Header with polarity toggle */}
      <div className="mb-0.5 sm:mb-2 lg:mb-3 flex items-center gap-1.5">
        <span className="metric-label text-base sm:text-lg lg:text-base font-semibold flex-1 leading-none">{metric.name}</span>
        {dataSourceBadge && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "shrink-0 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium leading-none border transition-colors",
                  dataSourceBadge.source === "Operacional"
                    ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                )}
                aria-label={`Origem: ${dataSourceBadge.source}`}
                onClick={(e) => e.stopPropagation()}
              >
                {dataSourceBadge.source === "Operacional" ? "OP" : "DB"}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[320px]">
              <p className="font-semibold mb-1">
                Painel {dataSourceBadge.source}
                {dataSourceBadge.source === "Dashboard" ? " (fallback)" : ""}
              </p>
              <p className="text-popover-foreground/80">
                <span className="text-popover-foreground/60">Campo filtrado:</span>{" "}
                <span className="font-mono">{dataSourceBadge.filter}</span>
                <span className="text-popover-foreground/60">
                  {dataSourceBadge.filter === "created_at"
                    ? " (data de criação do card)"
                    : " (mês atribuído ao card)"}
                </span>
              </p>
              {dataSourceBadge.formula && (
                <p className="mt-1.5">
                  <span className="text-popover-foreground/60">Fórmula:</span>{" "}
                  <span className="font-mono text-popover-foreground/90">{dataSourceBadge.formula}</span>
                </p>
              )}
              {dataSourceBadge.calculation && (
                <p className="text-popover-foreground/80 mt-1">{dataSourceBadge.calculation}</p>
              )}
              <p className="text-popover-foreground/60 mt-1.5 italic">
                {dataSourceBadge.source === "Operacional"
                  ? "Cards filtrados por data de criação; cada passagem entre etapas é contada (deduplicada por card)."
                  : "Snapshot do funil filtrado pelo campo 'mês' atribuído ao card."}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        {metric.description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="shrink-0 p-0.5 rounded-full transition-colors hover:bg-muted/80" aria-label="Informações do indicador" onClick={(e) => e.stopPropagation()}>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[320px] whitespace-pre-wrap">
              <p className="font-semibold mb-1">Conceito e Cálculo:</p>
              {metric.description}
            </TooltipContent>
          </Tooltip>
        )}
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


      <div className="flex-1 flex items-stretch gap-2 sm:gap-4 lg:gap-4">
        {/* Circular Progress - 1/3 */}
        {!hideTarget && (
        <div className="shrink-0 lg:w-1/3 flex items-center justify-center">
          <div className="hidden lg:block">
            <CircularProgress percentage={progress} rawPercentage={rawProgress} size={90} strokeWidth={9} hideValues={hideValues} />
          </div>
          <div className="hidden sm:block lg:hidden">
            <CircularProgress percentage={progress} rawPercentage={rawProgress} size={110} strokeWidth={10} hideValues={hideValues} />
          </div>
          <div className="block sm:hidden">
            <CircularProgress percentage={progress} rawPercentage={rawProgress} size={80} strokeWidth={8} hideValues={hideValues} />
          </div>
        </div>
        )}

        {/* Target and Realized values - 2/3 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0">
          {/* Resultado Acumulado custom layout */}
          {resultadoData ? (
            <>
              <div>
                <p className="text-[10px] sm:text-sm lg:text-xs text-muted-foreground uppercase tracking-wide">
                  Previsto
                </p>
                <p className="font-semibold text-foreground leading-none text-lg sm:text-2xl lg:text-2xl tracking-tighter">
                  {hideValues ? "••••••" : formatMetricValue(resultadoData.previsto, metric.unit, metric.name)}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-sm lg:text-xs text-muted-foreground uppercase tracking-wide">
                  Realizado
                </p>
                <p className="font-semibold text-foreground leading-none text-lg sm:text-2xl lg:text-2xl tracking-tighter">
                  {hideValues ? "••••••" : formatMetricValue(resultadoData.realizado, metric.unit, metric.name)}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-sm lg:text-xs text-muted-foreground uppercase tracking-wide">
                  Resultado
                </p>
                <p className={cn(
                  "leading-none text-xl sm:text-3xl lg:text-3xl font-sans font-extrabold tracking-tighter",
                  resultadoData.resultado >= 0 ? "text-success" : "text-destructive"
                )}>
                  {hideValues ? "••••••" : `${resultadoData.resultado >= 0 ? "+" : ""}${formatMetricValue(resultadoData.resultado, metric.unit, metric.name)}`}
                </p>
              </div>
            </>
          ) : (
            <>
          {/* Target - top */}
          {!hideTarget && (
          <div>
            <p className="text-[10px] sm:text-sm lg:text-xs text-muted-foreground uppercase tracking-wide">
              {forceAnnualLabel ? "Meta Anual" : isMonthSelected ? `Meta ${selectedMonthName || "Mensal"}` : isNonAccumulative ? "Meta" : hideAnnualTarget ? "Meta Mensal" : "Meta Anual"}
            </p>
            <p className="font-semibold text-foreground leading-none text-lg sm:text-2xl lg:text-2xl tracking-tighter">
              {hideValues ? "••••••" :
              isMonthSelected ?
              formatMetricValue(monthlyTarget, metric.unit, metric.name) :
              formatMetricValue(annualTarget, metric.unit, metric.name)}
            </p>
          </div>
          )}

          {/* Valor Previsto - middle (only when available and month selected) */}
          {isMonthSelected && forecastValue != null && (
          <div>
            <p className="text-[10px] sm:text-sm lg:text-xs text-muted-foreground uppercase tracking-wide">
              Previsto
            </p>
            <p className="font-semibold text-foreground leading-none text-lg sm:text-2xl lg:text-2xl tracking-tighter">
              {hideValues ? "••••••" : formatMetricValue(forecastValue, metric.unit, metric.name)}
            </p>
          </div>
          )}

          {/* Realized - bottom */}
          <div>
            <p className="text-[10px] sm:text-sm lg:text-xs text-muted-foreground uppercase tracking-wide">
              {isMonthSelected ? "Realizado" : "Acumulado"}
            </p>
            <div className="flex items-center gap-1">
              <p className="text-foreground leading-none text-xl sm:text-3xl lg:text-3xl font-sans font-extrabold tracking-tighter">
                {hideValues ? "••••••" : (
                  <>
                    {formatMetricValue(displayValue, metric.unit, metric.name)}
                    {getStageLabel(metric.name, displayValue) && (
                      <span className="text-lg sm:text-2xl lg:text-2xl font-semibold text-muted-foreground ml-1">
                        {getStageLabel(metric.name, displayValue)}
                      </span>
                    )}
                  </>
                )}
              </p>
              {pipelineCardNames && pipelineCardNames.length > 0 && !hideValues && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="shrink-0 p-0.5 rounded-full transition-colors hover:bg-muted/80" aria-label="Ver nomes dos leads" onClick={(e) => e.stopPropagation()}>
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[320px] max-h-[300px] overflow-y-auto">
                    <p className="font-semibold mb-1">{metric.name} ({pipelineCardNames.length})</p>
                    <ul className="space-y-0.5">
                      {pipelineCardNames.map((name, i) => (
                        <li key={i} className="text-popover-foreground/80">• {name}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          {/* Annual target in footer when viewing a specific month */}
          {!hideTarget && isMonthSelected && !isNonAccumulative && !forceAnnualLabel && !hideAnnualTarget && (
            <div className="text-[7px] sm:text-[8px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>Meta anual:</span>
              <span className="font-medium">{hideValues ? "••••••" : formatMetricValue(annualTarget, metric.unit, metric.name)}</span>
            </div>
          )}
          {/* Description / projection info */}
          {metric.description && (metric.description.startsWith("Projeção") || metric.description.startsWith("Meta anual")) && (
            <p className="text-xs sm:text-sm lg:text-xs text-muted-foreground mt-0 font-medium">
              📊 {metric.description}
            </p>
          )}
            </>
          )}
        </div>

        {sideContent && (
          <div className="shrink-0 basis-[38%] sm:basis-[34%] lg:basis-[32%] max-w-[9.5rem] min-w-0 flex flex-col justify-center gap-1 border-l border-border/50 pl-1.5 sm:pl-3 break-words">
            {sideContent}
          </div>
        )}

      </div>

      {children && (
        <div className="px-2 pb-2">
          {children}
        </div>
      )}

    </div>);

}