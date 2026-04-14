import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Legend
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TrainingMetrics } from "@/hooks/usePipelineData";

interface TrainingDashboardProps {
  training: TrainingMetrics;
  selectedMonth: number | null;
  selectedYear: number;
}

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function CollaboratorBreakdown({
  title,
  data,
  valueKey,
  suffix,
}: {
  title: string;
  data: { name: string; value: number }[];
  valueKey: string;
  suffix?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 w-full justify-center">
        <Users className="h-3 w-3" />
        <span>Por colaborador</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {data.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs px-2 py-1 rounded bg-muted/50">
              <span className="text-foreground truncate mr-2">{item.name}</span>
              <span className="font-medium text-foreground whitespace-nowrap">
                {item.value}{suffix}
              </span>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Sem dados</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TrainingDashboard({ training, selectedMonth, selectedYear }: TrainingDashboardProps) {
  const targets = training.targets;

  // Per-collaborator data for dropdowns
  const hoursPerCollaborator = useMemo(() => {
    return (training.topCollaborators ?? []).map((c) => ({
      name: c.name,
      value: c.hours,
    })).sort((a, b) => b.value - a.value);
  }, [training.topCollaborators]);

  const modulesPerCollaborator = useMemo(() => {
    return (training.topCollaborators ?? []).map((c) => ({
      name: c.name,
      value: c.modules,
    })).sort((a, b) => b.value - a.value);
  }, [training.topCollaborators]);

  // Chart data: hours per collaborator with monthly target line
  const chartData = useMemo(() => {
    const monthlyHoursTarget = targets ? targets.hours / (training.headcount || 1) : 10;
    return (training.topCollaborators ?? []).map((c) => ({
      name: c.name.split(" ")[0],
      fullName: c.name,
      totalHours: c.hours,
      monthlyTarget: monthlyHoursTarget,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [training.topCollaborators, targets, training.headcount]);

  const chartConfig = {
    monthlyTarget: { label: "Carga Horária Mês", color: "hsl(45, 93%, 47%)" },
    totalHours: { label: "Total de horas Geral", color: "hsl(213, 57%, 51%)" },
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Training Hours Chart */}
      {chartData.length > 0 && (
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
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border bg-popover p-2 shadow-md text-xs">
                        <p className="font-medium text-foreground mb-1">{data?.fullName}</p>
                        {payload.map((p: any, i: number) => (
                          <p key={i} className="text-muted-foreground">
                            {p.name === "monthlyTarget" ? "Carga Horária Mês" : "Total de horas"}: <span className="font-medium text-foreground">{p.value}h</span>
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) =>
                    value === "monthlyTarget" ? "Carga Horária Mês" : "Total de horas Geral"
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
      )}
    </div>
  );
}

// Export breakdown components for use in metric cards
export { CollaboratorBreakdown };
export type { TrainingDashboardProps };
