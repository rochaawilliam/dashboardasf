import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { MetricHistory } from "@/hooks/useMetrics";
import { format } from "date-fns";
import { parseLocalDate, getRefMonthYear } from "@/utils/dateUtils";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatMetricValue } from "@/utils/formatters";

interface SparklineProps {
  metricId: string;
  metricName: string;
  unit: string;
  historyData: MetricHistory[];
  selectedYear: number;
  className?: string;
  height?: number;
  showLabels?: boolean;
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx.toFixed(1)} ${prev.y.toFixed(1)}, ${cpx.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return d;
}

export function Sparkline({
  metricId,
  metricName,
  unit,
  historyData,
  selectedYear,
  className,
  height = 32,
  showLabels = false,
}: SparklineProps) {
  const monthlyData = useMemo(() => {
    const metricHistory = historyData
      .filter(h => h.metric_id === metricId)
      .filter(h => {
        const ref = getRefMonthYear(h.period_type, h.recorded_at);
        return ref.year === selectedYear;
      })
      .sort((a, b) => parseLocalDate(a.recorded_at).getTime() - parseLocalDate(b.recorded_at).getTime());

    const byMonth: Record<number, { value: number; date: Date }> = {};
    metricHistory.forEach(h => {
      const ref = getRefMonthYear(h.period_type, h.recorded_at);
      const month = ref.month - 1;
      const existing = byMonth[month];
      byMonth[month] = { value: (existing?.value || 0) + h.value, date: parseLocalDate(h.recorded_at) };
    });

    return Object.entries(byMonth)
      .map(([month, data]) => ({
        month: parseInt(month),
        value: data.value,
        date: data.date,
      }))
      .sort((a, b) => a.month - b.month);
  }, [historyData, metricId, selectedYear]);

  if (monthlyData.length < 2) {
    return (
      <div 
        className={cn("flex items-center justify-center text-[7px] sm:text-[8px] text-muted-foreground", className)}
        style={{ height }}
      >
        <span>Dados insuficientes</span>
      </div>
    );
  }

  const values = monthlyData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const width = 120;
  const paddingX = 4;
  const paddingY = 6;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = monthlyData.map((d, i) => {
    const x = paddingX + (i / (monthlyData.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${paddingX} ${height} Z`;

  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const isPositive = lastValue >= firstValue;

  const gradientId = `spark-grad-${metricId.slice(0, 8)}`;
  const strokeColor = isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "relative cursor-pointer transition-opacity hover:opacity-80 rounded-md overflow-hidden",
            className
          )}
          style={{ height }}
        >
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Area fill with gradient */}
            <path d={areaPath} fill={`url(#${gradientId})`} />
            {/* Smooth line */}
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Last point highlight */}
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="3"
              fill={strokeColor}
              opacity="0.9"
            />
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="5"
              fill={strokeColor}
              opacity="0.2"
            />
          </svg>
          {showLabels && (
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] text-muted-foreground px-0.5">
              {points.map((p, i) => (
                <span key={i}>
                  {format(p.date, 'MMM', { locale: ptBR }).slice(0, 3)}
                </span>
              ))}
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="top">
        <div className="space-y-2">
          <p className="text-xs font-medium">Evolução Mensal</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {format(d.date, 'MMMM', { locale: ptBR })}
                </span>
                <span className="font-medium">
                  {formatMetricValue(d.value, unit, metricName)}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Variação total:</span>
              <span className={cn(
                "font-medium",
                isPositive ? "text-success" : "text-destructive"
              )}>
                {isPositive ? "+" : ""}{((lastValue - firstValue) / (firstValue || 1) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
