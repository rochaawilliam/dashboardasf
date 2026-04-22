import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ComposedChart, Legend, Line
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { TrainingMetrics } from "@/hooks/usePipelineData";

interface TrainingDashboardProps {
  training: TrainingMetrics;
  selectedMonth: number | null;
  selectedYear: number;
}

export function TrainingDashboard({ training, selectedMonth, selectedYear }: TrainingDashboardProps) {
  const targets = training.targets;

  const chartData = useMemo(() => {
    return (training.topCollaborators ?? []).map((c) => ({
      name: c.name.split(" ")[0],
      fullName: c.name,
      totalHours: c.hours,
      monthlyTarget: c.hoursTarget ?? 5,
      nivel: c.nivel ?? "",
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [training.topCollaborators]);

  const chartConfig = {
    monthlyTarget: { label: "Carga Horária Mês", color: "hsl(45, 93%, 47%)" },
    totalHours: { label: "Total de horas Geral", color: "hsl(213, 57%, 51%)" },
  };

  if (chartData.length === 0) return null;

  return (
    <div className="space-y-4 mt-4">
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Carga Horária Treinamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
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
                      {payload.map((p: any, i: number) => (
                        <p key={i} className="text-muted-foreground">
                          {p.dataKey === "monthlyTarget" ? "Meta Individual" : "Total de horas"}: <span className="font-medium text-foreground">{p.value}h</span>
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value: string) =>
                  value === "monthlyTarget" ? "Meta Individual" : "Total de horas Geral"
                }
              />
              <Bar
                dataKey="monthlyTarget"
                fill="hsl(45, 93%, 47%)"
                radius={[2, 2, 0, 0]}
                barSize={30}
                label={{ position: "top", fontSize: 10, fill: "hsl(var(--foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="totalHours"
                stroke="hsl(213, 57%, 51%)"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(213, 57%, 51%)" }}
                label={{ position: "top", fontSize: 10, fill: "hsl(var(--foreground))", offset: 10 }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
