import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Clock, BookOpen, Trophy, Users, TrendingUp, Calendar, Award, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { TrainingMetrics } from "@/hooks/usePipelineData";

interface TrainingDashboardProps {
  training: TrainingMetrics;
  selectedMonth: number | null;
  selectedYear: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(200, 80%, 50%)",
];

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function MetricMiniCard({
  icon: Icon,
  label,
  value,
  suffix,
  target,
  colorClass,
}: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  target?: number;
  colorClass: string;
}) {
  const progress = target && target > 0 ? Math.min(100, Math.round((value / target) * 100)) : null;
  const status = progress !== null
    ? progress >= 100 ? "text-green-500" : progress >= 70 ? "text-yellow-500" : "text-red-500"
    : "";

  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold text-foreground">
              {value}{suffix}
            </p>
          </div>
        </div>
        {target !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={`font-medium ${status}`}>{progress}%</span>
              <span className="text-muted-foreground">Meta: {target}{suffix}</span>
            </div>
            <Progress value={progress ?? 0} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TrainingDashboard({ training, selectedMonth, selectedYear }: TrainingDashboardProps) {
  const targets = training.targets;

  const collaboratorData = useMemo(() => {
    return (training.topCollaborators ?? []).map((c) => ({
      name: c.name.split(" ")[0],
      fullName: c.name,
      hours: c.hours,
      modules: c.modules,
    }));
  }, [training.topCollaborators]);

  const monthlyData = useMemo(() => {
    const months: { month: string; hours: number; modules: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const key = `${selectedYear}-${String(m).padStart(2, "0")}`;
      const data = training.byMonth[key];
      months.push({
        month: MONTH_NAMES[m - 1],
        hours: data?.hours || 0,
        modules: data?.modules || 0,
      });
    }
    return months;
  }, [training.byMonth, selectedYear]);

  const themeData = useMemo(() => {
    return (training.themes ?? []).slice(0, 6).map((t) => ({
      name: t.name.length > 25 ? t.name.substring(0, 22) + "..." : t.name,
      fullName: t.name,
      hours: t.hours,
      modules: t.modules,
    }));
  }, [training.themes]);

  const top3 = (training.topCollaborators ?? []).slice(0, 3);
  const collabs = training.topCollaborators ?? [];
  const avgHoursPerPerson = collabs.length > 0
    ? Math.round((training.totalHours ?? 0) / collabs.length * 10) / 10
    : 0;

  const chartConfig = {
    hours: { label: "Horas", color: "hsl(var(--primary))" },
    modules: { label: "Módulos", color: "hsl(var(--accent))" },
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Summary mini-cards with targets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricMiniCard
          icon={Users}
          label="Headcount Ativo"
          value={training.headcount}
          target={targets?.headcount}
          colorClass="bg-primary/10 text-primary"
        />
        <MetricMiniCard
          icon={Clock}
          label="Horas de Treinamento"
          value={training.totalHours}
          suffix="h"
          target={targets?.hours}
          colorClass="bg-primary/10 text-primary"
        />
        <MetricMiniCard
          icon={BookOpen}
          label="Módulos Concluídos"
          value={training.totalModules}
          target={targets?.modules}
          colorClass="bg-accent/10 text-accent"
        />
        <MetricMiniCard
          icon={Award}
          label="Taxa de Certificação"
          value={training.certificationRate}
          suffix="%"
          target={targets?.certificationRate}
          colorClass="bg-warning/10 text-warning"
        />
        <MetricMiniCard
          icon={Calendar}
          label="Tempo Médio de Casa"
          value={training.avgMonths}
          suffix=" meses"
          target={targets?.avgTenureMonths}
          colorClass="bg-success/10 text-success"
        />
        <MetricMiniCard
          icon={Target}
          label="Média/Pessoa"
          value={avgHoursPerPerson}
          suffix="h"
          colorClass="bg-muted text-muted-foreground"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hours by Collaborator */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Horas por Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {collaboratorData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={collaboratorData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {collaboratorData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados de treinamento</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Evolution */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução Mensal ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={monthlyData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hours by Theme/Module */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              Horas por Módulo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {themeData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={themeData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {themeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Collaborators */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" />
              Top 3 Colaboradores
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {top3.map((collab, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                const maxHours = top3[0]?.hours || 1;
                const pct = Math.round((collab.hours / maxHours) * 100);
                return (
                  <div key={collab.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <span className="text-lg">{medals[i]}</span>
                        {collab.name}
                      </span>
                      <span className="text-sm font-bold text-foreground">{collab.hours}h</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: COLORS[i],
                        }}
                      />
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{collab.modules} módulos</span>
                      <span>{collab.certified} certificados</span>
                    </div>
                  </div>
                );
              })}
              {top3.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
