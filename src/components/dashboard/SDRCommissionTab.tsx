import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, CalendarCheck, FileText } from "lucide-react";
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

const SDR_TIERS = [
  { min: 120, value: 650 },
  { min: 110, value: 570 },
  { min: 100, value: 490 },
  { min: 90, value: 410 },
  { min: 80, value: 325 },
];

// Metric IDs
const REUNIOES_EMP = "2b59c639-5e5f-4d0d-b0aa-5a3394444389";
const REUNIOES_TRAB = "717fb24d-f213-4135-ae10-42a4237979bd";
const REUNIOES_TRIB = "45277578-48f9-4eda-87f5-28bc66918236";
const PROPOSTAS_EMP = "af0307d2-186e-4bf3-b536-66c451ccf056";
const PROPOSTAS_TRAB = "a88438f0-dbd0-4230-9b18-d56117936d36";
const PROPOSTAS_TRIB = "7f937d5a-6502-4fdd-810d-11fc4413d864";

const SDR_METRIC_IDS = [REUNIOES_EMP, REUNIOES_TRAB, REUNIOES_TRIB, PROPOSTAS_EMP, PROPOSTAS_TRAB, PROPOSTAS_TRIB];

function getHalfCommission(percentage: number): number {
  const rounded = Math.round(percentage);
  for (const tier of SDR_TIERS) {
    if (rounded >= tier.min) return Math.round(tier.value / 2);
  }
  return 0;
}

/** Green-based status: emerald for good, amber for mid, red for low */
function pctColor(pct: number) {
  if (pct >= 100) return "text-emerald-400";
  if (pct >= 80) return "text-amber-400";
  return "text-red-400";
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div
        className={cn(
          "h-2 rounded-full transition-all duration-500",
          pct >= 100 ? "bg-emerald-500" : pct >= 80 ? "bg-amber-500" : "bg-red-500"
        )}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

interface MetricGroupCardProps {
  title: string;
  icon: React.ReactNode;
  items: { name: string; achieved: number; target: number }[];
  stripLabel: string;
}

function MetricGroupCard({ title, icon, items, stripLabel }: MetricGroupCardProps) {
  const ach = items.reduce((s, i) => s + i.achieved, 0);
  const tgt = items.reduce((s, i) => s + i.target, 0);
  const pct = tgt > 0 ? Math.round((ach / tgt) * 100) : 0;

  return (
    <Card className="border-l-4 border-l-emerald-500 bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            {icon}
          </div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xl font-bold text-foreground">{formatNumber(ach)}</span>
            <span className="text-xs text-muted-foreground ml-1">/ {formatNumber(tgt)}</span>
          </div>
          <span className={cn("text-lg font-bold", pctColor(pct))}>
            {pct}%
          </span>
        </div>
        <ProgressBar pct={pct} />
        <div className="space-y-0.5">
          {items.map(item => {
            const iPct = item.target > 0 ? Math.round((item.achieved / item.target) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                <span className="truncate mr-2 text-foreground/70">{item.name.replace(stripLabel, "")}</span>
                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="text-muted-foreground">{formatNumber(item.achieved)}/{formatNumber(item.target)}</span>
                  <span className={cn("font-medium min-w-[32px] text-right", pctColor(iPct))}>{iPct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface CommissionColumnProps {
  title: string;
  pct: number;
  commission: number;
}

function CommissionColumn({ title, pct, commission }: CommissionColumnProps) {
  const rounded = Math.round(pct);
  const activeTier = SDR_TIERS.find(t => rounded >= t.min);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <span className={cn("text-sm font-bold", pctColor(rounded))}>
          {rounded}%
        </span>
      </div>
      <div className="space-y-0.5">
        {SDR_TIERS.slice().reverse().map(tier => {
          const isActive = activeTier?.min === tier.min;
          return (
            <div key={tier.min} className={cn(
              "flex items-center justify-between text-xs px-2.5 py-1 rounded-md transition-colors",
              isActive
                ? "bg-emerald-500/15 text-emerald-300 font-semibold ring-1 ring-emerald-500/30"
                : "text-muted-foreground hover:bg-muted/30"
            )}>
              <span>≥ {tier.min}%</span>
              <span>R$ {formatNumber(Math.round(HALF_COMMISSION * tier.pct))}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">Subtotal:</span>
        <span className={cn("text-base font-bold", commission > 0 ? "text-emerald-400" : "text-muted-foreground")}>
          R$ {formatNumber(commission)}
        </span>
      </div>
    </div>
  );
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

    return { target, breakdown };
  }, [metrics, monthlyValues, accumulatedValues, monthlyTargets, selectedMonth, selectedYear]);

  const reunioesItems = data.breakdown.filter(i => i.name.startsWith("Reuniões"));
  const propostasItems = data.breakdown.filter(i => i.name.startsWith("Propostas"));

  const reunioesAch = reunioesItems.reduce((s, i) => s + i.achieved, 0);
  const reunioesTgt = reunioesItems.reduce((s, i) => s + i.target, 0);
  const reunioesPct = reunioesTgt > 0 ? (reunioesAch / reunioesTgt) * 100 : 0;
  const reunioesCommission = getHalfCommission(reunioesPct);

  const propostasAch = propostasItems.reduce((s, i) => s + i.achieved, 0);
  const propostasTgt = propostasItems.reduce((s, i) => s + i.target, 0);
  const propostasPct = propostasTgt > 0 ? (propostasAch / propostasTgt) * 100 : 0;
  const propostasCommission = getHalfCommission(propostasPct);

  const totalCommission = reunioesCommission + propostasCommission;

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const periodLabel = selectedMonth !== null ? monthNames[selectedMonth - 1] : `Acumulado ${selectedYear}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-emerald-500/10">
          <Target className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">Salário Variável - SDR</h2>
          <p className="text-xs text-muted-foreground">{periodLabel} • {selectedYear}</p>
        </div>
      </div>

      {/* Two-column layout: Reuniões | Propostas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricGroupCard
          title="Reuniões Agendadas"
          icon={<CalendarCheck className="h-4 w-4 text-emerald-400" />}
          items={reunioesItems}
          stripLabel="Reuniões agendadas "
        />
        <MetricGroupCard
          title="Propostas Elaboradas"
          icon={<FileText className="h-4 w-4 text-emerald-400" />}
          items={propostasItems}
          stripLabel="Propostas elaboradas "
        />
      </div>

      {/* Comissão Card */}
      <Card className="border-l-4 border-l-emerald-500 bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <Trophy className="h-4 w-4 text-emerald-400" />
            </div>
            <CardTitle className="text-sm font-semibold">Comissão</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:divide-x sm:divide-border">
            <CommissionColumn
              title="Reuniões Agendadas"
              pct={reunioesPct}
              commission={reunioesCommission}
            />
            <div className="sm:pl-4">
              <CommissionColumn
                title="Propostas Elaboradas"
                pct={propostasPct}
                commission={propostasCommission}
              />
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total:</span>
              <span className={cn("text-2xl font-bold", totalCommission > 0 ? "text-emerald-400" : "text-muted-foreground")}>
                R$ {formatNumber(totalCommission)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
