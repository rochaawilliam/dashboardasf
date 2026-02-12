import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Target, FileText, Trophy } from "lucide-react";
import type { Metric, MetricHistory, MonthlyTarget } from "@/hooks/useMetrics";
import { organizeMetricsBySubcategory } from "@/utils/metricOrganizer";
import { getRefMonthYear } from "@/utils/dateUtils";
import { formatNumber } from "@/utils/formatters";

interface CommissionTabProps {
  metrics: Metric[];
  historyData?: MetricHistory[];
  monthlyTargets?: MonthlyTarget[];
  selectedMonth: number | null;
  selectedYear: number;
  monthlyValues: Record<string, number>;
  accumulatedValues: Record<string, number>;
}

const COMMISSION_TIERS = [
  { min: 120, value: 2500 },
  { min: 110, value: 2200 },
  { min: 100, value: 1900 },
  { min: 90, value: 1600 },
  { min: 80, value: 1300 },
];

function getCommission(percentage: number): number {
  const rounded = Math.round(percentage);
  for (const tier of COMMISSION_TIERS) {
    if (rounded >= tier.min) return tier.value;
  }
  return 0;
}

function TridentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v20" />
      <path d="M12 2L5 9" />
      <path d="M12 2l7 7" />
      <path d="M5 9v3" />
      <path d="M19 9v3" />
      <path d="M9 22h6" />
      <path d="M10 18h4" />
    </svg>
  );
}

export { TridentIcon };

function CommissionCard({ 
  title, 
  icon: Icon, 
  achieved, 
  target, 
  unit,
  commission 
}: { 
  title: string;
  icon: any;
  achieved: number;
  target: number;
  unit: string;
  commission: number;
}) {
  const rawPercentage = target > 0 ? (achieved / target) * 100 : 0;
  const percentage = Math.round(rawPercentage);
  
  // Find the highest tier the percentage qualifies for
  const activeTier = COMMISSION_TIERS.find(t => percentage >= t.min);
  
  return (
    <Card className="border-l-4 border-l-purple-500 bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10">
            <Icon className="h-4 w-4 text-purple-400" />
          </div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Progress info */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xl font-bold text-foreground">
              {unit === "R$" ? `R$ ${formatNumber(achieved)}` : formatNumber(achieved)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              / {unit === "R$" ? `R$ ${formatNumber(target)}` : formatNumber(target)}
            </span>
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
            className="h-2 rounded-full bg-purple-500 transition-all"
            style={{ width: `${Math.min(percentage, 120)}%`, maxWidth: "100%" }}
          />
        </div>

        {/* Commission tiers */}
        <div className="space-y-1">
          {COMMISSION_TIERS.slice().reverse().map((tier) => {
            const isActive = activeTier?.min === tier.min;
            return (
              <div 
                key={tier.min}
                className={cn(
                  "flex items-center justify-between text-xs px-2 py-1 rounded",
                  isActive ? "bg-purple-500/20 text-purple-300 font-semibold" : "text-muted-foreground"
                )}
              >
                <span>{tier.min}% da meta</span>
                <span>R$ {formatNumber(tier.value)}</span>
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
              commission > 0 ? "text-purple-400" : "text-muted-foreground"
            )}>
              R$ {formatNumber(commission)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CommissionTab({
  metrics,
  historyData,
  monthlyTargets,
  selectedMonth,
  selectedYear,
  monthlyValues,
  accumulatedValues,
}: CommissionTabProps) {
  // Compute Receita Total (sum of revenue subcategories)
  const receitaData = useMemo(() => {
    const lucratividadeMetrics = metrics.filter(m => m.category === "lucratividade");
    const organized = organizeMetricsBySubcategory(lucratividadeMetrics, "lucratividade");
    const revenueSubcats = ["Assessoria", "Consultoria", "Pontual", "Sucumbência", "Patenteia"];
    
    const revenueMetrics = organized
      .filter(s => revenueSubcats.includes(s.name))
      .flatMap(s => s.metrics);
    
    const achieved = selectedMonth !== null
      ? revenueMetrics.reduce((sum, m) => sum + (monthlyValues[m.id] ?? 0), 0)
      : revenueMetrics.reduce((sum, m) => sum + (accumulatedValues[m.id] ?? 0), 0);
    
    // Get monthly target sum for revenue metrics
    let target = 0;
    if (selectedMonth !== null && monthlyTargets) {
      revenueMetrics.forEach(m => {
        const mt = monthlyTargets.find(t => t.metric_id === m.id && t.year === selectedYear && t.month === selectedMonth);
        target += mt ? mt.target_value : 0;
      });
    } else {
      // Annual: sum all monthly targets for the year
      revenueMetrics.forEach(m => {
        const mts = (monthlyTargets || []).filter(t => t.metric_id === m.id && t.year === selectedYear);
        if (mts.length > 0) {
          target += mts.reduce((s, t) => s + t.target_value, 0);
        } else {
          target += m.target_value;
        }
      });
    }
    
    return { achieved, target };
  }, [metrics, monthlyValues, accumulatedValues, monthlyTargets, selectedMonth, selectedYear]);

  // Compute Total Contratos using the "Total de Contratos" card value and monthly targets
  const TOTAL_CONTRATOS_ID = "d3e4f5a6-b7c8-9012-cdef-234567890abc";
  const CONTRATOS_EMP_ASSESSORIA_ID = "f80d5c78-cf50-4aca-befb-5808b6557d8e";
  const CONTRATOS_TRIB_ASSESSORIA_ID = "a1102d97-a2a6-44d6-8ac7-716cc1474d16";
  const CONTRATOS_TRIB_PONTUAL_ID = "95280373-3e3b-4596-b2c4-ce8e01ee1b2c";
  const CONTRATOS_TRAB_ASSESSORIA_ID = "ae64d582-a08d-442c-998e-b6bc214e486e";

  const contratosData = useMemo(() => {
    // Compute achieved value same way as Index.tsx: Total Emp Assessoria + Trib Assessoria + Trib Pontual + Total Trab Assessoria
    // We need prev month contract base values
    const refMonth = selectedMonth ?? new Date().getMonth() + 1;
    let empBase = 20;
    let trabBase = 14;
    
    if (refMonth > 1 && historyData) {
      const prevMonth = refMonth - 1;
      let empSum = 0;
      let trabSum = 0;
      const CONTRATOS_EMP_CONSULTORIA_ID = "90726f8c-8cf7-47d8-81b6-c6f22c4eeef5";
      const CONTRATOS_TRAB_CONSULTORIA_ID = "0ffeaffb-ab3c-4371-be5b-172f57160ec4";
      historyData.forEach(h => {
        const ref = getRefMonthYear(h.period_type, h.recorded_at);
        if (ref.year === selectedYear && ref.month === prevMonth) {
          if (h.metric_id === CONTRATOS_EMP_ASSESSORIA_ID || h.metric_id === CONTRATOS_EMP_CONSULTORIA_ID) empSum += h.value;
          if (h.metric_id === CONTRATOS_TRAB_ASSESSORIA_ID || h.metric_id === CONTRATOS_TRAB_CONSULTORIA_ID) trabSum += h.value;
        }
      });
      empBase = empSum;
      trabBase = trabSum;
    } else if (refMonth > 1) {
      empBase = 0;
      trabBase = 0;
    }

    const CONTRATOS_EMP_CONSULTORIA_ID = "90726f8c-8cf7-47d8-81b6-c6f22c4eeef5";
    const CONTRATOS_TRAB_CONSULTORIA_ID = "0ffeaffb-ab3c-4371-be5b-172f57160ec4";

    const totalEmpAss = empBase + (monthlyValues[CONTRATOS_EMP_ASSESSORIA_ID] ?? 0);
    const empConsult = monthlyValues[CONTRATOS_EMP_CONSULTORIA_ID] ?? 0;
    const tribAss = monthlyValues[CONTRATOS_TRIB_ASSESSORIA_ID] ?? 0;
    const tribPont = monthlyValues[CONTRATOS_TRIB_PONTUAL_ID] ?? 0;
    const totalTrabAss = trabBase + (monthlyValues[CONTRATOS_TRAB_ASSESSORIA_ID] ?? 0);
    const trabConsult = monthlyValues[CONTRATOS_TRAB_CONSULTORIA_ID] ?? 0;
    const achieved = selectedMonth !== null
      ? totalEmpAss + empConsult + tribAss + tribPont + totalTrabAss + trabConsult
      : (accumulatedValues[TOTAL_CONTRATOS_ID] ?? 0);

    // Get target from monthly_targets for Total de Contratos
    let target = 0;
    if (selectedMonth !== null && monthlyTargets) {
      const mt = monthlyTargets.find(t => t.metric_id === TOTAL_CONTRATOS_ID && t.year === selectedYear && t.month === selectedMonth);
      target = mt ? mt.target_value : 0;
    } else {
      const mts = (monthlyTargets || []).filter(t => t.metric_id === TOTAL_CONTRATOS_ID && t.year === selectedYear);
      target = mts.length > 0 ? mts.reduce((s, t) => s + t.target_value, 0) : 0;
    }
    
    return { achieved, target };
  }, [metrics, monthlyValues, accumulatedValues, monthlyTargets, selectedMonth, selectedYear, historyData]);

  const receitaCommission = getCommission(receitaData.target > 0 ? (receitaData.achieved / receitaData.target) * 100 : 0);
  const contratosCommission = getCommission(contratosData.target > 0 ? (contratosData.achieved / contratosData.target) * 100 : 0);
  const totalCommission = receitaCommission + contratosCommission;

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const periodLabel = selectedMonth !== null ? monthNames[selectedMonth - 1] : `Acumulado ${selectedYear}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-purple-500/10">
          <TridentIcon className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">Salário Variável - Head de Crescimento</h2>
          <p className="text-xs text-muted-foreground">{periodLabel} • {selectedYear}</p>
        </div>
      </div>

      {/* Commission Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CommissionCard
          title="Receita Total"
          icon={DollarSign}
          achieved={receitaData.achieved}
          target={receitaData.target}
          unit="R$"
          commission={receitaCommission}
        />
        <CommissionCard
          title="Novos Contratos"
          icon={FileText}
          achieved={contratosData.achieved}
          target={contratosData.target}
          unit="contratos"
          commission={contratosCommission}
        />
      </div>

      {/* Total Commission */}
      <Card className="border-2 border-purple-500/50 bg-purple-500/5">
        <CardContent className="py-5 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20">
                <Trophy className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Comissão Total</p>
                <p className="text-xs text-muted-foreground">{periodLabel}</p>
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-purple-400">
              R$ {formatNumber(totalCommission)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
