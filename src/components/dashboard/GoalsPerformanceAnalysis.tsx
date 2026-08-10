import { useMemo, useState, useEffect, useRef } from "react";
import { Gauge, Sparkles, RefreshCw, Loader2, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Metric, MonthlyTarget } from "@/hooks/useMetrics";

const nonAccumulativeKeywords = [
  "Ticket Médio", "Margem", "Churn", "Custo Fixo", "Folha sobre Receita",
  "Inadimplência", "Cumprimento do Orçamento", "Lead Time", "SLA", "NPS",
  "ENPS", "Taxa", "Turnover", "LTV", "Upsell",
];

function isNonAccumulative(name: string, unit: string): boolean {
  if (unit === "%" || unit.toLowerCase().includes("percent")) return true;
  return nonAccumulativeKeywords.some((k) => name.toLowerCase().includes(k.toLowerCase()));
}

export interface GoalsAnalysisProps {
  tabTitle: string;
  metrics: Metric[];
  monthlyValues: Record<string, number | null>;
  accumulatedValues: Record<string, number>;
  monthlyTargets?: MonthlyTarget[];
  selectedMonth: number | null;
  selectedYear: number;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Semicircular gauge (velocímetro) */
function GaugeChart({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 88;
  const stroke = 16;

  const polar = (pct: number) => {
    const angle = Math.PI * (1 - pct / 100);
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };

  const arc = (from: number, to: number) => {
    const a = polar(from);
    const b = polar(to);
    // O medidor cobre no máximo 180°, então nunca é um arco "grande".
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
  };

  const needleAngle = Math.PI * (1 - clamped / 100);
  const nx = cx + (r - 24) * Math.cos(needleAngle);
  const ny = cy - (r - 24) * Math.sin(needleAngle);

  const color =
    clamped >= 100 ? "hsl(var(--success))" : clamped >= 85 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size / 2 + 26} viewBox={`0 0 ${size} ${size / 2 + 26}`} className="overflow-visible">
        {/* zones */}
        <path d={arc(0, 60)} fill="none" stroke="hsl(var(--destructive) / 0.18)" strokeWidth={stroke} strokeLinecap="round" />
        <path d={arc(60, 85)} fill="none" stroke="hsl(var(--warning) / 0.2)" strokeWidth={stroke} />
        <path d={arc(85, 100)} fill="none" stroke="hsl(var(--success) / 0.2)" strokeWidth={stroke} strokeLinecap="round" />
        {/* value arc */}
        {clamped > 0 && (
          <path
            d={arc(0, clamped)}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{ transition: "all .6s ease" }}
          />
        )}
        {/* needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--foreground))" />
        <text x={cx - r - 2} y={cy + 20} textAnchor="middle" className="fill-muted-foreground" fontSize="9">0%</text>
        <text x={cx + r + 2} y={cy + 20} textAnchor="middle" className="fill-muted-foreground" fontSize="9">100%</text>
      </svg>
      <div className="-mt-6 text-center">
        <div className="text-3xl font-bold" style={{ color, fontFamily: "'Roboto', sans-serif" }}>
          {Math.round(clamped)}%
        </div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Metas indutoras</div>
      </div>
    </div>
  );
}

/** Minimal markdown renderer (bold, headings-as-bold, bullets) */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="text-foreground">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function AnalysisText({ text }: { text: string }) {
  const blocks = text.split("\n").filter((l) => l.trim().length > 0);
  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
      {blocks.map((line, i) => {
        const trimmed = line.trim().replace(/^#+\s*/, "");
        if (/^[-*•]\s+/.test(trimmed)) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-primary mt-[2px]">•</span>
              <p className="flex-1">{renderInline(trimmed.replace(/^[-*•]\s+/, ""))}</p>
            </div>
          );
        }
        return <p key={i}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

export function GoalsPerformanceAnalysis({
  tabTitle,
  metrics,
  monthlyValues,
  accumulatedValues,
  monthlyTargets = [],
  selectedMonth,
  selectedYear,
}: GoalsAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef<string>("");

  const computed = useMemo(() => {
    const items = metrics
      .map((metric) => {
        const nonAcc = isNonAccumulative(metric.name, metric.unit);
        const specific = selectedMonth
          ? monthlyTargets.find(
              (mt) => mt.metric_id === metric.id && mt.month === selectedMonth && mt.year === selectedYear,
            )
          : null;
        const monthlyTarget = specific
          ? Number(specific.target_value)
          : nonAcc
          ? Number(metric.target_value)
          : Number(metric.target_value) / 12;

        const annualRows = monthlyTargets.filter((mt) => mt.metric_id === metric.id && mt.year === selectedYear);
        const annualTarget = annualRows.length
          ? nonAcc
            ? annualRows.reduce((s, t) => s + Number(t.target_value || 0), 0) / annualRows.length
            : annualRows.reduce((s, t) => s + Number(t.target_value || 0), 0)
          : Number(metric.target_value);

        const value = selectedMonth
          ? Number(monthlyValues[metric.id] ?? 0)
          : Number(accumulatedValues[metric.id] ?? 0);
        const target = selectedMonth ? monthlyTarget : annualTarget;
        if (!target || target <= 0) return null;

        const isInverse = metric.polarity === "lower_is_better";
        const raw = isInverse
          ? value > 0
            ? (target / value) * 100
            : 100
          : (value / target) * 100;

        return {
          name: metric.name,
          unit: metric.unit,
          value: Number(value.toFixed(2)),
          target: Number(target.toFixed(2)),
          progress: Math.max(0, raw),
          polarity: metric.polarity,
        };
      })
      .filter(Boolean) as {
      name: string; unit: string; value: number; target: number; progress: number; polarity: string;
    }[];

    const overall = items.length
      ? items.reduce((s, i) => s + Math.min(i.progress, 100), 0) / items.length
      : 0;

    return { items, overall };
  }, [metrics, monthlyValues, accumulatedValues, monthlyTargets, selectedMonth, selectedYear]);

  const periodLabel = selectedMonth ? `${MONTH_NAMES[selectedMonth - 1]}/${selectedYear}` : `Ano de ${selectedYear}`;

  const today = new Date();
  const isCurrentMonth =
    !!selectedMonth && selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();
  const daysInMonth = selectedMonth ? new Date(selectedYear, selectedMonth, 0).getDate() : undefined;
  const dayOfMonth = isCurrentMonth ? today.getDate() : daysInMonth;

  const fetchAnalysis = async () => {
    if (computed.items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-goals", {
        body: {
          tabTitle,
          periodLabel,
          dayOfMonth,
          daysInMonth,
          overall: computed.overall,
          metrics: computed.items,
        },
      });
      if (fnError) throw fnError;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAnalysis((data as any)?.analysis ?? "");
    } catch (e: any) {
      setError("Não foi possível gerar a análise agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  // auto-generate once per tab/period/data snapshot
  useEffect(() => {
    const key = `${tabTitle}|${periodLabel}|${Math.round(computed.overall)}|${computed.items.length}`;
    if (key === lastKey.current) return;
    if (computed.items.length === 0) return;
    lastKey.current = key;
    setAnalysis("");
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabTitle, periodLabel, computed.overall, computed.items.length]);

  if (computed.items.length === 0) return null;

  const highlights = [...computed.items].sort((a, b) => a.progress - b.progress).slice(0, 3);

  return (
    <div className="mb-3 rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground leading-tight" style={{ fontFamily: "'Roboto', sans-serif" }}>
              Análise de Desempenho — {tabTitle}
            </h4>
            <p className="text-[10px] text-muted-foreground">{periodLabel} · {computed.items.length} metas indutoras monitoradas</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={fetchAnalysis} disabled={loading}>
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 items-start">
        <div className="flex flex-col items-center">
          <GaugeChart value={computed.overall} />
          <div className="mt-2 w-full space-y-1">
            {highlights.map((h) => (
              <div key={h.name} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="truncate text-muted-foreground">{h.name}</span>
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    h.progress >= 100 ? "text-success" : h.progress >= 85 ? "text-warning" : "text-destructive",
                  )}
                >
                  {Math.round(h.progress)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-3 min-h-[140px]">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Panorama gerado por IA</span>
          </div>
          {loading && !analysis ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-6">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analisando o desempenho das metas indutoras...
            </div>
          ) : error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : analysis ? (
            <AnalysisText text={analysis} />
          ) : (
            <p className="text-xs text-muted-foreground">Clique em "Atualizar" para gerar a análise.</p>
          )}
        </div>
      </div>
    </div>
  );
}
