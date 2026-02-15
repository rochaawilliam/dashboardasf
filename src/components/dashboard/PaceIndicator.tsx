import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Target, CalendarCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MetricHistory } from "@/hooks/useMetrics";
import { parseLocalDate, getRefMonthYear } from "@/utils/dateUtils";
import { formatMetricValue } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaceIndicatorProps {
  metricId: string;
  metricName: string;
  unit: string;
  annualTarget: number;
  historyData: MetricHistory[];
  selectedYear: number;
  isInverse?: boolean;
  isNonAccumulative?: boolean;
  className?: string;
}

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export function PaceIndicator({
  metricId,
  metricName,
  unit,
  annualTarget,
  historyData,
  selectedYear,
  isInverse = false,
  isNonAccumulative = false,
  className,
}: PaceIndicatorProps) {
  const paceData = useMemo(() => {
    const metricHistory = historyData
      .filter(h => h.metric_id === metricId)
      .filter(h => {
        const ref = getRefMonthYear(h.period_type, h.recorded_at);
        return ref.year === selectedYear;
      });

    // Sum values per month
    const byMonth: Record<number, number> = {};
    metricHistory.forEach(h => {
      const ref = getRefMonthYear(h.period_type, h.recorded_at);
      const month = ref.month; // 1-indexed
      byMonth[month] = (byMonth[month] || 0) + h.value;
    });

    const monthsWithData = Object.keys(byMonth).map(Number).sort((a, b) => a - b);
    if (monthsWithData.length === 0) {
      return null;
    }

    const totalAccumulated = Object.values(byMonth).reduce((sum, v) => sum + v, 0);
    const monthCount = monthsWithData.length;
    const avgPerMonth = totalAccumulated / monthCount;
    const lastMonthWithData = Math.max(...monthsWithData);

    if (isNonAccumulative) {
      // For non-accumulative metrics (%, averages), check if current avg meets target
      const latestValue = byMonth[lastMonthWithData] || 0;
      return {
        avgPerMonth: latestValue,
        totalAccumulated: latestValue,
        monthCount,
        lastMonthWithData,
        projectedTotal: latestValue,
        projectedMonth: latestValue >= annualTarget ? lastMonthWithData : null,
        isOnTrack: isInverse ? latestValue <= annualTarget : latestValue >= annualTarget,
        isAlreadyAchieved: isInverse ? latestValue <= annualTarget : latestValue >= annualTarget,
        remainingMonths: 0,
        isNonAccumulative: true,
      };
    }

    // For accumulative metrics, project when target will be reached
    if (avgPerMonth <= 0 && !isInverse) {
      return {
        avgPerMonth: 0,
        totalAccumulated,
        monthCount,
        lastMonthWithData,
        projectedTotal: totalAccumulated,
        projectedMonth: null,
        isOnTrack: false,
        isAlreadyAchieved: false,
        remainingMonths: null,
        isNonAccumulative: false,
      };
    }

    const projectedTotal = avgPerMonth * 12;
    const isAlreadyAchieved = isInverse 
      ? totalAccumulated <= annualTarget 
      : totalAccumulated >= annualTarget;

    if (isAlreadyAchieved) {
      return {
        avgPerMonth,
        totalAccumulated,
        monthCount,
        lastMonthWithData,
        projectedTotal,
        projectedMonth: lastMonthWithData,
        isOnTrack: true,
        isAlreadyAchieved: true,
        remainingMonths: 0,
        isNonAccumulative: false,
      };
    }

    const remaining = annualTarget - totalAccumulated;
    const monthsNeeded = Math.ceil(remaining / avgPerMonth);
    const projectedMonth = lastMonthWithData + monthsNeeded;
    const isOnTrack = projectedMonth <= 12;

    return {
      avgPerMonth,
      totalAccumulated,
      monthCount,
      lastMonthWithData,
      projectedTotal,
      projectedMonth: projectedMonth > 12 ? null : projectedMonth,
      isOnTrack,
      isAlreadyAchieved: false,
      remainingMonths: monthsNeeded,
      isNonAccumulative: false,
    };
  }, [metricId, historyData, selectedYear, annualTarget, isInverse, isNonAccumulative]);

  if (!paceData) {
    return (
      <div className={cn("flex items-center justify-center text-[7px] sm:text-[8px] text-muted-foreground", className)}>
        <span>Sem dados</span>
      </div>
    );
  }

  const { isOnTrack, isAlreadyAchieved, projectedMonth, projectedTotal } = paceData;

  const statusColor = isAlreadyAchieved
    ? "text-success"
    : isOnTrack
    ? "text-success"
    : "text-destructive";

  const statusBg = isAlreadyAchieved
    ? "bg-success/10"
    : isOnTrack
    ? "bg-success/10"
    : "bg-destructive/10";

  const StatusIcon = isAlreadyAchieved
    ? CheckCircle2
    : isOnTrack
    ? CalendarCheck
    : AlertTriangle;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 rounded-md p-1 cursor-pointer transition-colors hover:opacity-80",
            statusBg,
            className
          )}
        >
          <StatusIcon className={cn("h-3.5 w-3.5", statusColor)} />
          {isAlreadyAchieved ? (
            <span className={cn("text-[8px] font-semibold leading-tight text-center", statusColor)}>
              Atingida
            </span>
          ) : projectedMonth ? (
            <span className={cn("text-[8px] font-semibold leading-tight text-center", statusColor)}>
              {monthNames[projectedMonth - 1]}
            </span>
          ) : (
            <span className={cn("text-[8px] font-semibold leading-tight text-center", statusColor)}>
              {paceData.isNonAccumulative ? "Abaixo" : "> Dez"}
            </span>
          )}
          <span className="text-[7px] text-muted-foreground leading-tight">Ritmo</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" side="top">
        <div className="space-y-2">
          <p className="text-xs font-medium flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Projeção de Ritmo
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Média mensal:</span>
              <span className="font-medium">
                {formatMetricValue(paceData.avgPerMonth, unit, metricName)}
              </span>
            </div>
            {!paceData.isNonAccumulative && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acumulado:</span>
                  <span className="font-medium">
                    {formatMetricValue(paceData.totalAccumulated, unit, metricName)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projeção anual:</span>
                  <span className={cn("font-medium", statusColor)}>
                    {formatMetricValue(projectedTotal, unit, metricName)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Meta anual:</span>
              <span className="font-medium">
                {formatMetricValue(annualTarget, unit, metricName)}
              </span>
            </div>
            <div className="pt-1.5 border-t">
              {isAlreadyAchieved ? (
                <p className="text-success font-medium">✓ Meta já atingida!</p>
              ) : isOnTrack ? (
                <p className="text-success font-medium">
                  ✓ No ritmo — previsão: {projectedMonth ? monthNames[projectedMonth - 1] : "—"}/{selectedYear}
                </p>
              ) : (
                <p className="text-destructive font-medium">
                  ⚠ Ritmo insuficiente para atingir a meta anual
                </p>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
