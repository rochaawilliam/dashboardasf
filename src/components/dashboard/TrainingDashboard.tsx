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
    </div>
  );
}
