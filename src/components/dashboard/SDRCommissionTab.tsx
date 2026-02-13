import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target } from "lucide-react";
import type { Metric, MonthlyTarget } from "@/hooks/useMetrics";
import { formatNumber } from "@/utils/formatters";

interface SDRCommissionTabProps {
  metrics: Metric[];
  monthlyTargets?: MonthlyTarget[];
  selectedMonth: number | null;
  selectedYear: number;
  monthlyValues: Record<string, number>;
  accumulatedValues: Record<string, number>;
}

const TOTAL_COMMISSION = 650;

const SDR_TIERS = [
  { min: 100, label: "100%", pct: 1.0 },
  { min: 90, label: "90%", pct: 0.9 },
  { min: 80, label: "80%", pct: 0.8 },
  { min: 70, label: "70%", pct: 0.7 },
  { min: 60, label: "60%", pct: 0.6 },
];

// Metric IDs
const REUNIOES_EMP = "2b59c639-5e5f-4d0d-b0aa-5a3394444389";
const REUNIOES_TRAB = "717fb24d-f213-4135-ae10-42a4237979bd";
const REUNIOES_TRIB = "45277578-48f9-4eda-87f5-28bc66918236";
const PROPOSTAS_EMP = "af0307d2-186e-4bf3-b536-66c451ccf056";
const PROPOSTAS_TRAB = "a88438f0-dbd0-4230-9b18-d56117936d36";
const PROPOSTAS_TRIB = "7f937d5a-6502-4fdd-810d-11fc4413d864";

const SDR_METRIC_IDS = [REUNIOES_EMP, REUNIOES_TRAB, REUNIOES_TRIB, PROPOSTAS_EMP, PROPOSTAS_TRAB, PROPOSTAS_TRIB];

function getSDRCommission(percentage: number): number {
  const rounded = Math.round(percentage);
  for (const tier of SDR_TIERS) {
    if (rounded >= tier.min) return Math.round(TOTAL_COMMISSION * tier.pct);
  }
  return 0;
}

export function SDRCommissionTab({
  metrics,
  monthlyTargets,
  selectedMonth,
  selectedYear,
  monthlyValues,
  accumulatedValues,
}: SDRCommissionTabProps) {
  const data = useMemo(() => {
    const sdrMetrics = metrics.filter(m => SDR_METRIC_IDS.includes(m.id));

    const achieved = selectedMonth !== null
      ? sdrMetrics.reduce((sum, m) => sum + (monthlyValues[m.id] ?? 0), 0)
      : sdrMetrics.reduce((sum, m) => sum + (accumulatedValues[m.id] ?? 0), 0);

    let target = 0;
    if (selectedMonth !== null && monthlyTargets) {
      sdrMetrics.forEach(m => {
        const mt = monthlyTargets.find(t => t.metric_id === m.id && t.year === selectedYear && t.month === selectedMonth);
        target += mt ? mt.target_value : Math.round((m.target_value / 12) * 100) / 100;
      });
    } else {
      sdrMetrics.forEach(m => {
        const mts = (monthlyTargets || []).filter(t => t.metric_id === m.id && t.year === selectedYear);
        if (mts.length > 0) {
          target += mts.reduce((s, t) => s + t.target_value, 0);
        } else {
          target += m.target_value;
        }
      });
    }

    // Per-metric breakdown
    const breakdown = sdrMetrics.map(m => ({
      name: m.name,
      achieved: selectedMonth !== null ? (monthlyValues[m.id] ?? 0) : (accumulatedValues[m.id] ?? 0),
      target: (() => {
        if (selectedMonth !== null && monthlyTargets) {
          const mt = monthlyTargets.find(t => t.metric_id === m.id && t.year === selectedYear && t.month === selectedMonth);
          return mt ? mt.target_value : Math.round((m.target_value / 12) * 100) / 100;
        }
        const mts = (monthlyTargets || []).filter(t => t.metric_id === m.id && t.year === selectedYear);
        return mts.length > 0 ? mts.reduce((s, t) => s + t.target_value, 0) : m.target_value;
      })(),
    }));

    return { achieved, target, breakdown };
  }, [metrics, monthlyValues, accumulatedValues, monthlyTargets, selectedMonth, selectedYear]);

  const rawPercentage = data.target > 0 ? (data.achieved / data.target) * 100 : 0;
  const percentage = Math.round(rawPercentage);
  const commission = getSDRCommission(rawPercentage);
  const activeTier = SDR_TIERS.find(t => percentage >= t.min);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const periodLabel = selectedMonth !== null ? monthNames[selectedMonth - 1] : `Acumulado ${selectedYear}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-green-500/10">
          <Target className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">Salário Variável - SDR</h2>
          <p className="text-xs text-muted-foreground">{periodLabel} • {selectedYear}</p>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="border-l-4 border-l-green-500 bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-500/10">
              <Target className="h-4 w-4 text-green-400" />
            </div>
            <CardTitle className="text-sm font-semibold">Reuniões + Propostas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {/* Progress info */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold text-foreground">{formatNumber(data.achieved)}</span>
              <span className="text-xs text-muted-foreground ml-1">/ {formatNumber(data.target)}</span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              percentage >= 100 ? "text-green-400" : percentage >= 80 ? "text-yellow-400" : "text-red-400"
            )}>
              {percentage}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {/* Breakdown - two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Reuniões Agendadas */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-green-400 px-2">Reuniões Agendadas</p>
              {data.breakdown.filter(item => item.name.startsWith("Reuniões")).map(item => {
                const pct = item.target > 0 ? Math.round((item.achieved / item.target) * 100) : 0;
                const label = item.name.replace("Reuniões agendadas ", "");
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs px-2 py-1 rounded text-muted-foreground">
                    <span className="truncate mr-2">{label}</span>
                    <span className="shrink-0">{formatNumber(item.achieved)} / {formatNumber(item.target)} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
            {/* Propostas Elaboradas */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-green-400 px-2">Propostas Elaboradas</p>
              {data.breakdown.filter(item => item.name.startsWith("Propostas")).map(item => {
                const pct = item.target > 0 ? Math.round((item.achieved / item.target) * 100) : 0;
                const label = item.name.replace("Propostas elaboradas ", "");
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs px-2 py-1 rounded text-muted-foreground">
                    <span className="truncate mr-2">{label}</span>
                    <span className="shrink-0">{formatNumber(item.achieved)} / {formatNumber(item.target)} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commission tiers */}
          <div className="space-y-1 pt-2 border-t border-border/50">
            {SDR_TIERS.slice().reverse().map(tier => {
              const isActive = activeTier?.min === tier.min;
              return (
                <div
                  key={tier.min}
                  className={cn(
                    "flex items-center justify-between text-xs px-2 py-1 rounded",
                    isActive ? "bg-green-500/20 text-green-300 font-semibold" : "text-muted-foreground"
                  )}
                >
                  <span>≥ {tier.min}% da meta</span>
                  <span>R$ {formatNumber(Math.round(TOTAL_COMMISSION * tier.pct))}</span>
                </div>
              );
            })}
          </div>

          {/* Commission result */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Comissão:</span>
              <span className={cn(
                "text-lg font-bold",
                commission > 0 ? "text-green-400" : "text-muted-foreground"
              )}>
                R$ {formatNumber(commission)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Commission */}
      <Card className="border-2 border-green-500/50 bg-green-500/5">
        <CardContent className="py-5 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/20">
                <Trophy className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Comissão Total SDR</p>
                <p className="text-xs text-muted-foreground">{periodLabel}</p>
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-green-400">
              R$ {formatNumber(commission)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
