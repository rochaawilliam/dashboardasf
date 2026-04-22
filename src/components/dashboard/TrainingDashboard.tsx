import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ComposedChart, Legend, Line, ReferenceLine, Cell
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { TrainingMetrics } from "@/hooks/usePipelineData";

interface TrainingDashboardProps {
  training: TrainingMetrics;
  selectedMonth: number | null;
  selectedYear: number;
}

export function TrainingDashboard({ training, selectedMonth, selectedYear }: TrainingDashboardProps) {
  const chartData = useMemo(() => {
    const source = training.allCollaborators ?? training.topCollaborators ?? [];
    return source.map((c) => ({
      name: ('fullName' in c && c.fullName) ? c.fullName.split(" ").slice(0, 2).join(" ") : c.name.split(" ")[0],
      fullName: ('fullName' in c && c.fullName) ? c.fullName : c.name,
      totalHours: c.hours,
      monthlyTarget: ('hoursTarget' in c) ? c.hoursTarget : 5,
      nivel: ('nivel' in c) ? c.nivel : "",
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [training.allCollaborators, training.topCollaborators]);

  const chartConfig = {
    totalHours: { label: "Horas Realizadas", color: "hsl(213, 57%, 51%)" },
    monthlyTarget: { label: "Meta Individual", color: "hsl(45, 93%, 47%)" },
  };

  if (chartData.length === 0) return null;

  // Alternating background colors for subdivision
  const bgColors = ["hsl(var(--muted) / 0.15)", "transparent"];

  return (
    <div className="space-y-4 mt-4">
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Carga Horária Treinamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  return (
                    <div className="rounded-lg border bg-popover p-2 shadow-md text-xs">
                      <p className="font-medium text-foreground mb-1">{data?.fullName}</p>
                      {data?.nivel && (
                        <p className="text-muted-foreground mb-1">Nível: <span className="font-medium text-foreground">{data.nivel}</span></p>
                      )}
                      <p className="text-muted-foreground">
                        Horas Realizadas: <span className="font-medium text-foreground">{data?.totalHours}h</span>
                      </p>
                      <p className="text-muted-foreground">
                        Meta Individual: <span className="font-medium text-foreground">{data?.monthlyTarget}h</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) =>
                  value === "totalHours" ? "Horas Realizadas" : "Meta Individual"
                }
              />
              {/* Alternating reference areas for subdivision */}
              {chartData.map((_, i) =>
                i % 2 === 0 ? (
                  <ReferenceLine
                    key={`ref-${i}`}
                    x={chartData[i].name}
                    stroke="hsl(var(--border))"
                    strokeDasharray="2 4"
                    strokeOpacity={0.4}
                  />
                ) : null
              )}
              <Bar
                dataKey="totalHours"
                radius={[3, 3, 0, 0]}
                barSize={28}
                label={{ position: "top", fontSize: 10, fill: "hsl(var(--foreground))" }}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={entry.totalHours === 0 ? "hsl(var(--muted-foreground) / 0.2)" : "hsl(213, 57%, 51%)"}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="monthlyTarget"
                stroke="hsl(45, 93%, 47%)"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(45, 93%, 47%)" }}
                label={{ position: "top", fontSize: 10, fill: "hsl(var(--foreground))", offset: 10 }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
