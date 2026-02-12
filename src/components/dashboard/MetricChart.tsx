import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { parseLocalDate } from "@/utils/dateUtils";
import { ptBR } from "date-fns/locale";
import type { Metric } from "@/hooks/useMetrics";
import { formatNumber } from "@/utils/formatters";

interface MetricChartProps {
  data: Array<{
    id: string;
    metric_id: string;
    value: number;
    recorded_at: string;
    period_type: string;
    created_at: string;
    metrics: { name: string; unit: string } | null;
  }>;
  metrics: Metric[];
  title: string;
}

const COLORS = [
  "hsl(221, 83%, 53%)", // primary blue
  "hsl(173, 80%, 40%)", // accent teal
  "hsl(142, 71%, 45%)", // success green
  "hsl(38, 92%, 50%)",  // warning amber
  "hsl(280, 60%, 50%)", // purple
  "hsl(0, 84%, 60%)",   // destructive red
];

export function MetricChart({ data, metrics, title }: MetricChartProps) {
  const chartData = useMemo(() => {
    // Group data by date
    const grouped: Record<string, Record<string, number | string>> = {};
    
    data.forEach((item) => {
      const dateKey = format(parseLocalDate(item.recorded_at), "MMM/yy", { locale: ptBR });
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey };
      }
      if (item.metrics) {
        grouped[dateKey][item.metrics.name] = Number(item.value.toFixed(2));
      }
    });
    
    return Object.values(grouped).sort((a, b) => {
      const dateA = a.date as string;
      const dateB = b.date as string;
      return dateA.localeCompare(dateB);
    });
  }, [data]);

  const metricNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach((item) => {
      if (item.metrics?.name) {
        names.add(item.metrics.name);
      }
    });
    return Array.from(names);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="metric-card">
        <h3 className="font-semibold text-foreground mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Nenhum dado histórico disponível
        </div>
      </div>
    );
  }

  return (
    <div className="metric-card">
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => formatNumber(value, 0)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => formatNumber(value, 2)}
            />
            <Legend 
              wrapperStyle={{ fontSize: "12px" }}
            />
            {metricNames.map((name, index) => {
              const metric = metrics.find((m) => m.name === name);
              return (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
