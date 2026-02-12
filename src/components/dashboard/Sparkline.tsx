import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { MetricHistory } from "@/hooks/useMetrics";
import { format } from "date-fns";
import { parseLocalDate } from "@/utils/dateUtils";
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
      .filter(h => parseLocalDate(h.recorded_at).getFullYear() === selectedYear)
      .sort((a, b) => parseLocalDate(a.recorded_at).getTime() - parseLocalDate(b.recorded_at).getTime());

    // Group by month and take latest value per month
    const byMonth: Record<number, { value: number; date: Date }> = {};
    metricHistory.forEach(h => {
      const date = parseLocalDate(h.recorded_at);
      const month = date.getMonth();
      byMonth[month] = { value: h.value, date };
    });

    // Convert to array with month indices
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

  // Calculate SVG path
  const width = 100;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = monthlyData.map((d, i) => {
    const x = padding + (i / (monthlyData.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Create area path
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${padding} ${height - padding} Z`;

  // Determine trend color
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const isPositive = lastValue >= firstValue;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "relative cursor-pointer transition-opacity hover:opacity-80",
            className
          )}
          style={{ height }}
        >
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Area fill */}
            <path
              d={areaD}
              fill={isPositive ? "hsl(var(--success) / 0.15)" : "hsl(var(--destructive) / 0.15)"}
            />
            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="2.5"
                fill="hsl(var(--background))"
                stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                strokeWidth="1.5"
              />
            ))}
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
