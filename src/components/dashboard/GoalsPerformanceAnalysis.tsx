import { useMemo, useState, useEffect, useRef } from "react";
import { Gauge, Sparkles, RefreshCw, Loader2, TrendingUp, ChevronDown, ListChecks, AlertTriangle, ArrowUpCircle, Send } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Metric, MonthlyTarget } from "@/hooks/useMetrics";
import { getRefMonthYear } from "@/utils/dateUtils";

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
const GAUGE_MAX = 120;

function GaugeChart({ value, refPct = 100 }: { value: number; refPct?: number }) {
  const ref = Math.max(1, Math.min(100, refPct));
  const warnRef = ref * 0.85;
  const clamped = Math.max(0, Math.min(GAUGE_MAX, value));
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 88;
  const stroke = 16;

  const polar = (pct: number) => {
    const angle = Math.PI * (1 - pct / GAUGE_MAX);
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };

  const arc = (from: number, to: number) => {
    const a = polar(from);
    const b = polar(to);
    // O medidor cobre no máximo 180°, então nunca é um arco "grande".
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
  };

  const needleAngle = Math.PI * (1 - clamped / GAUGE_MAX);
  const nx = cx + (r - 24) * Math.cos(needleAngle);
  const ny = cy - (r - 24) * Math.sin(needleAngle);

  const color =
    clamped > 100
      ? "hsl(210 90% 55%)"
      : clamped >= ref
      ? "hsl(var(--success))"
      : clamped >= warnRef
      ? "hsl(var(--warning))"
      : "hsl(var(--destructive))";

  const refInner = {
    x: cx + (r - stroke / 2 - 2) * Math.cos(Math.PI * (1 - ref / GAUGE_MAX)),
    y: cy - (r - stroke / 2 - 2) * Math.sin(Math.PI * (1 - ref / GAUGE_MAX)),
  };
  const refOuter = {
    x: cx + (r + stroke / 2 + 2) * Math.cos(Math.PI * (1 - ref / GAUGE_MAX)),
    y: cy - (r + stroke / 2 + 2) * Math.sin(Math.PI * (1 - ref / GAUGE_MAX)),
  };

  return (
    <div className="relative flex flex-col items-center w-full">
      <svg
        width="100%"
        height={size / 2 + 26}
        viewBox={`0 0 ${size} ${size / 2 + 26}`}
        preserveAspectRatio="xMidYMid meet"
        className="max-w-[220px] w-full h-auto overflow-visible"
      >

        {/* zones */}
        <path d={arc(0, warnRef)} fill="none" stroke="hsl(var(--destructive) / 0.18)" strokeWidth={stroke} strokeLinecap="round" />
        <path d={arc(warnRef, ref)} fill="none" stroke="hsl(var(--warning) / 0.2)" strokeWidth={stroke} />
        <path d={arc(ref, 100)} fill="none" stroke="hsl(var(--success) / 0.2)" strokeWidth={stroke} />
        <path d={arc(100, GAUGE_MAX)} fill="none" stroke="hsl(210 90% 55% / 0.2)" strokeWidth={stroke} strokeLinecap="round" />
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
        {/* pace reference marker */}
        {ref < 100 && (
          <line
            x1={refInner.x}
            y1={refInner.y}
            x2={refOuter.x}
            y2={refOuter.y}
            stroke="hsl(var(--foreground) / 0.6)"
            strokeWidth={2}
          />
        )}
        {/* needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--foreground))" />
        <text x={cx - r - 2} y={cy + 20} textAnchor="middle" className="fill-muted-foreground" fontSize="9">0%</text>
        <text x={cx + r + 2} y={cy + 20} textAnchor="middle" className="fill-muted-foreground" fontSize="9">{GAUGE_MAX}%</text>
      </svg>
      <div className="-mt-6 text-center">
        <div className="text-3xl font-bold" style={{ color, fontFamily: "'Roboto', sans-serif" }}>
          {Math.round(clamped)}%
        </div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Metas indutoras</div>
        <div className="text-xs text-muted-foreground">
          Referência do período: {Math.round(ref)}%
        </div>
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

function splitAnalysis(text: string) {
  const idx = text.search(/\*\*?\s*Checklist[^\n]*/i);
  let main = text;
  let checklist: string[] = [];
  if (idx !== -1) {
    main = text.slice(0, idx).trim();
    checklist = text
      .slice(idx)
      .split("\n")
      .slice(1)
      .map((l) => l.trim().replace(/^[-*•]\s*/, "").replace(/^\[\s*\]\s*/, ""))
      .filter((l) => l.length > 0 && !/^\*\*/.test(l));
  }

  // Separa panorama geral dos pontos de melhoria
  const impIdx = main.search(/^[#*\s]*\**\s*Pontos? de melhoria/im);
  let panorama = main;
  let improvements = "";
  if (impIdx !== -1) {
    panorama = main.slice(0, impIdx).trim();
    improvements = main
      .slice(impIdx)
      .split("\n")
      .slice(1)
      .join("\n")
      .trim();
  }

  return { main, panorama, improvements, checklist };
}

function ChecklistPanel({ items, context }: { items: string[]; context: string }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [sending, setSending] = useState(false);

  const pending = items.filter((_, i) => !done[i]);

  const handleSend = async () => {
    if (pending.length === 0) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-tasks-to-pipeline", {
        body: { tasks: pending.map((t) => ({ title: t })), context },
      });
      if (error) throw error;
      const created = (data as any)?.created ?? 0;
      const updated = (data as any)?.updated ?? 0;
      toast({
        title: "Tarefas enviadas ao Pipeline",
        description: `${created} criada(s), ${updated} atualizada(s). Sem responsável definido — qualquer usuário pode assumir.`,
      });
    } catch (e: any) {
      toast({
        title: "Não foi possível enviar as tarefas",
        description: e?.message ?? "Erro desconhecido ao integrar com o Pipeline.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
            className="w-full flex items-start gap-2 text-left group"
          >
            <span
              className={cn(
                "mt-[2px] h-3.5 w-3.5 shrink-0 rounded border border-border flex items-center justify-center text-[9px] leading-none",
                done[i] && "bg-primary border-primary text-primary-foreground",
              )}
            >
              {done[i] ? "✓" : ""}
            </span>
            <span className={cn("text-base leading-relaxed text-muted-foreground", done[i] && "line-through opacity-60")}>
              {renderInline(item)}
            </span>
          </button>
        ))}
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full gap-2"
        onClick={handleSend}
        disabled={sending || pending.length === 0}
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Enviar tarefas para o Pipeline
      </Button>
    </div>
  );
}


function AnalysisText({ text }: { text: string }) {
  const blocks = text.split("\n").filter((l) => l.trim().length > 0);
  return (
    <div className="space-y-2 text-base leading-relaxed text-muted-foreground">
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

/** Recupera o valor de uma métrica a partir dos snapshots mensais congelados. */
function snapshotValueFor(
  metricName: string,
  sources: Record<string, any> | undefined,
): number | undefined {
  if (!sources) return undefined;
  const n = metricName.toLowerCase();

  const pipeline = sources["pipeline"]?.months;
  if (pipeline) {
    const isOnline = /on-?line|\bon\b/.test(n);
    const isOffline = /off-?line|\boff\b/.test(n);
    const side = isOnline ? pipeline.online : isOffline ? pipeline.offline : null;
    const both = (k: string) =>
      Number(pipeline.online?.[k] ?? 0) + Number(pipeline.offline?.[k] ?? 0);
    const pick = (k: string) => (side ? Number(side[k] ?? 0) : both(k));

    if (n.includes("novos leads")) return pick("new_leads");
    if (n.includes("leads no funil")) return pick("leads");
    if (n.includes("reuni")) return pick("reunioes");
    if (n.includes("proposta")) return pick("propostas");
    if (n.includes("prospect")) return pick("prospects");
    if (n.includes("valor gerado")) return pick("valor_gerado");
    if (n.includes("novos contratos") && (isOnline || isOffline)) return pick("contratos");
  }

  const traffic = sources["traffic_funnel"]?.months;
  if (traffic) {
    if (n.includes("impress")) return Number(traffic.impressoes ?? 0);
    if (n.includes("alcance")) return Number(traffic.alcance ?? 0);
    if (n.includes("conversas")) return Number(traffic.conversas_iniciadas ?? 0);
    if (n.includes("valor investido")) return Number(traffic.valor_investido ?? 0);
  }

  const fin = sources["financial_cashflow"]?.months;
  if (fin) {
    if (n.includes("receita total")) return Number(fin.boleto_total ?? fin.total_recebimentos ?? 0);
    if (n.includes("lucratividade")) return Number(fin.lucratividade_pct ?? 0);
    if (n.includes("folha sobre receita")) return Number(fin.folha_sobre_receita_pct ?? 0);
    if (n.includes("custo fixo sobre receita")) return Number(fin.custo_fixo_sobre_receita_pct ?? 0);
  }

  return undefined;
}

const SHORT_MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Histórico mensal de atingimento das metas indutoras da aba */
function GoalsTrendChart({
  tabTitle,
  metrics,
  monthlyTargets,
  selectedYear,
  selectedMonth,
}: {
  tabTitle: string;
  metrics: Metric[];
  monthlyTargets: MonthlyTarget[];
  selectedYear: number;
  selectedMonth: number | null;
}) {
  const metricIds = useMemo(() => metrics.map((m) => m.id).sort(), [metrics]);
  const [open, setOpen] = useState(false);

  const { data: snapshots } = useQuery({
    queryKey: ["goals-trend-snapshots", selectedYear],
    enabled: open,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("month_snapshots")
        .select("source, month, payload")
        .eq("year", selectedYear);
      if (error) throw error;
      return (data ?? []) as { source: string; month: number; payload: any }[];
    },
  });

  const { data: history, isLoading } = useQuery({
    queryKey: ["goals-trend-history", selectedYear, metricIds],
    enabled: open && metricIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const rows: { metric_id: string; value: number; recorded_at: string; period_type: string }[] = [];
      const chunk = 80;
      for (let i = 0; i < metricIds.length; i += chunk) {
        const { data, error } = await supabase
          .from("metric_history")
          .select("metric_id, value, recorded_at, period_type")
          .in("metric_id", metricIds.slice(i, i + chunk))
          .gte("recorded_at", `${selectedYear - 1}-12-01`)
          .lte("recorded_at", `${selectedYear + 1}-01-31`)
          .order("recorded_at", { ascending: true });
        if (error) throw error;
        rows.push(...((data ?? []) as typeof rows));
      }
      return rows;
    },
  });

  const snapshotByMonth = useMemo(() => {
    const map: Record<number, Record<string, any>> = {};
    (snapshots ?? []).forEach((s) => {
      if (!map[s.month]) map[s.month] = {};
      map[s.month][s.source] = s.payload;
    });
    return map;
  }, [snapshots]);

  const chartData = useMemo(() => {
    if (!history) return [];
    // último lançamento de cada métrica dentro de cada mês
    const byMonth: Record<number, Record<string, number>> = {};
    history.forEach((row) => {
      const { month, year } = getRefMonthYear(row.period_type, row.recorded_at);
      if (year !== selectedYear) return;
      if (!byMonth[month]) byMonth[month] = {};
      byMonth[month][row.metric_id] = Number(row.value);
    });

    const today = new Date();
    const lastMonth =
      selectedYear < today.getFullYear() ? 12 : selectedYear > today.getFullYear() ? 0 : today.getMonth() + 1;

    const result: { month: string; monthIndex: number; atingimento: number | null; metas: number }[] = [];
    for (let m = 1; m <= lastMonth; m++) {
      const values = byMonth[m] ?? {};
      const progresses: number[] = [];
      metrics.forEach((metric) => {
        const nonAcc = isNonAccumulative(metric.name, metric.unit);
        const specific = monthlyTargets.find(
          (mt) => mt.metric_id === metric.id && mt.month === m && mt.year === selectedYear,
        );
        const target = specific
          ? Number(specific.target_value)
          : nonAcc
          ? Number(metric.target_value)
          : Number(metric.target_value) / 12;
        if (!target || target <= 0) return;
        const value = values[metric.id] ?? snapshotValueFor(metric.name, snapshotByMonth[m]);
        if (value === undefined || value === null) return;
        const isInverse = metric.polarity === "lower_is_better";
        const raw = isInverse ? (value > 0 ? (target / value) * 100 : 100) : (value / target) * 100;
        progresses.push(Math.min(Math.max(0, raw), GAUGE_MAX));
      });

      result.push({
        month: SHORT_MONTHS[m - 1],
        monthIndex: m,
        atingimento: progresses.length ? Number((progresses.reduce((s, v) => s + v, 0) / progresses.length).toFixed(1)) : null,
        metas: progresses.length,
      });
    }
    return result;
  }, [history, metrics, monthlyTargets, selectedYear, snapshotByMonth]);

  const withData = chartData.filter((d) => d.atingimento !== null);

  return (
    <div className="mt-3 rounded-lg border border-border/50 bg-card p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-1.5">
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Tendência do atingimento — {tabTitle} ({selectedYear})
          </span>
        </div>
        {withData.length > 1 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {withData[withData.length - 1].atingimento! >= withData[withData.length - 2].atingimento! ? "▲" : "▼"}{" "}
            {Math.abs(
              withData[withData.length - 1].atingimento! - withData[withData.length - 2].atingimento!,
            ).toFixed(1)}{" "}
            p.p. vs. mês anterior
          </span>
        )}
      </button>

      {!open ? null : isLoading ? (
        <div className="h-40 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando histórico...
        </div>
      ) : withData.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
          Ainda não há histórico mensal suficiente para esta aba.
        </div>
      ) : (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="goalsTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis
                domain={[0, GAUGE_MAX]}
                ticks={[0, 30, 60, 85, 100, GAUGE_MAX]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <ReferenceLine y={100} stroke="hsl(var(--success))" strokeDasharray="4 4" strokeOpacity={0.6} />
              <ReferenceLine y={85} stroke="hsl(var(--warning))" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, _n, item: any) => [
                  `${value?.toFixed(1)}% (${item?.payload?.metas} metas)`,
                  "Atingimento",
                ]}
              />
              <Area
                type="monotone"
                dataKey="atingimento"
                stroke="none"
                fill="url(#goalsTrendFill)"
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="atingimento"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                connectNulls
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (cy === null || payload.atingimento === null) return <g key={props.key} />;
                  const v = payload.atingimento as number;
                  const c =
                    v > 100
                      ? "hsl(210 90% 55%)"
                      : v >= 100
                      ? "hsl(var(--success))"
                      : v >= 85
                      ? "hsl(var(--warning))"
                      : "hsl(var(--destructive))";
                  const active = payload.monthIndex === selectedMonth;
                  return (
                    <circle
                      key={props.key}
                      cx={cx}
                      cy={cy}
                      r={active ? 5 : 3.5}
                      fill={c}
                      stroke="hsl(var(--card))"
                      strokeWidth={active ? 2 : 1}
                    />
                  );
                }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}


interface AlertItem { name: string; progress: number }

function AlertsPanel({ below, above, refLabel }: { below: AlertItem[]; above: AlertItem[]; refLabel: number }) {
  const [open, setOpen] = useState(false);
  const total = below.length + above.length;
  if (total === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-border/50 bg-card p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-1.5">
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
          <AlertTriangle className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Alertas de desvio</span>
        </div>
        <div className="flex items-center gap-1.5">
          {below.length > 0 && (
            <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-xs font-semibold text-destructive tabular-nums">
              {below.length} abaixo de {refLabel}%
            </span>
          )}
          {above.length > 0 && (
            <span className="rounded-full bg-[hsl(210_90%_55%/0.15)] px-1.5 py-0.5 text-xs font-semibold text-[hsl(210_90%_55%)] tabular-nums">
              {above.length} acima de 100%
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {below.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs font-semibold text-destructive">
                    {below.length} {below.length === 1 ? "meta abaixo" : "metas abaixo"} da referência ({refLabel}%)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {below.map((i) => (
                    <span key={i.name} className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-xs text-destructive tabular-nums">
                      {i.name} · {Math.round(i.progress)}%
                    </span>
                  ))}
                </div>
              </div>
            )}
            {above.length > 0 && (
              <div className="rounded-lg border border-[hsl(210_90%_55%/0.4)] bg-[hsl(210_90%_55%/0.1)] p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowUpCircle className="h-3.5 w-3.5 text-[hsl(210_90%_55%)]" />
                  <span className="text-xs font-semibold text-[hsl(210_90%_55%)]">
                    {above.length} {above.length === 1 ? "meta superada" : "metas superadas"} (acima de 100%)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {above.map((i) => (
                    <span
                      key={i.name}
                      className="rounded-full bg-[hsl(210_90%_55%/0.15)] px-1.5 py-0.5 text-xs text-[hsl(210_90%_55%)] tabular-nums"
                    >
                      {i.name} · {Math.round(i.progress)}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type AlertLevel = "critical" | "warning" | "onTarget" | "above";

function statusOf(progress: number, ref = 100): AlertLevel {
  if (progress > 100) return "above";
  if (progress >= ref) return "onTarget";
  if (progress >= ref * 0.85) return "warning";
  return "critical";
}

const STATUS_STYLES: Record<AlertLevel, { label: string; text: string; bg: string; border: string; ring: string }> = {
  critical: {
    label: "Abaixo da referência",
    text: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/40",
    ring: "bg-destructive",
  },
  warning: {
    label: "Atenção",
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/40",
    ring: "bg-warning",
  },
  onTarget: {
    label: "Na meta",
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/40",
    ring: "bg-success",
  },
  above: {
    label: "Acima da meta",
    text: "text-[hsl(210_90%_55%)]",
    bg: "bg-[hsl(210_90%_55%/0.12)]",
    border: "border-[hsl(210_90%_55%/0.4)]",
    ring: "bg-[hsl(210_90%_55%)]",
  },
};

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
      ? items.reduce((s, i) => s + Math.min(i.progress, GAUGE_MAX), 0) / items.length
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

  
  const paceRef = isCurrentMonth && dayOfMonth && daysInMonth
    ? Math.max(1, Math.min(100, (dayOfMonth / daysInMonth) * 100))
    : 100;
  const alertThreshold = Math.round(paceRef * 0.85);
  const overallStatus = statusOf(computed.overall, paceRef);
  const overallStyle = STATUS_STYLES[overallStatus];
  const belowRef = computed.items.filter((i) => i.progress < paceRef * 0.85).sort((a, b) => a.progress - b.progress);
  const aboveTarget = computed.items.filter((i) => i.progress > 100).sort((a, b) => b.progress - a.progress);

  return (
    <div className={cn("mb-3 rounded-xl border bg-muted/20 p-3 sm:p-4 transition-colors", overallStyle.border)}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 shrink-0 rounded-lg bg-primary/10 text-primary">
            <Gauge className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base sm:text-lg font-semibold text-foreground leading-tight truncate" style={{ fontFamily: "'Roboto', sans-serif" }}>
              Análise de Desempenho — {tabTitle}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{periodLabel} · {computed.items.length} metas indutoras</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">

          <span
            className={cn(
              "hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold",
              overallStyle.bg,
              overallStyle.border,
              overallStyle.text,
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              {overallStatus === "critical" && (
                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping", overallStyle.ring)} />
              )}
              <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", overallStyle.ring)} />
            </span>
            {overallStyle.label} · {Math.round(computed.overall)}%
          </span>
          <Button variant="outline" size="sm" className="h-7 text-sm gap-1" onClick={fetchAnalysis} disabled={loading}>
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Primeira coluna: velocímetro + Panorama geral */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col items-center rounded-lg border border-border/50 bg-card p-3 sm:p-4">
            <GaugeChart value={computed.overall} refPct={paceRef} />
          </div>

          <div className="rounded-lg border border-border/50 bg-card p-3 sm:p-4 flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-base font-semibold text-foreground">Panorama geral</span>
            </div>
            {loading && !analysis ? (
              <div className="flex items-center gap-2 text-base text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando o desempenho das metas indutoras...
              </div>
            ) : error ? (
              <p className="text-base text-destructive">{error}</p>
            ) : analysis ? (
              <AnalysisText text={splitAnalysis(analysis).panorama} />
            ) : (
              <p className="text-base text-muted-foreground">Clique em "Atualizar" para gerar a análise.</p>
            )}
          </div>
        </div>

        {/* Segunda coluna: pontos de melhoria */}
        <div className="rounded-lg border border-border/50 bg-card p-3 sm:p-4 min-h-[140px]">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-base font-semibold text-foreground">Pontos de melhoria</span>
          </div>
          {loading && !analysis ? (
            <div className="flex items-center gap-2 text-base text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Levantando pontos de melhoria...
            </div>
          ) : splitAnalysis(analysis).improvements ? (
            <AnalysisText text={splitAnalysis(analysis).improvements} />
          ) : (
            <p className="text-base text-muted-foreground">Nenhum ponto de melhoria gerado ainda.</p>
          )}
        </div>

        {/* Terceira coluna: checklist */}
        <div className="rounded-lg border border-border/50 bg-card p-3 sm:p-4 min-h-[140px]">
          <div className="flex items-center gap-1.5 mb-2">
            <ListChecks className="h-4 w-4 text-primary" />
            <span className="text-base font-semibold text-foreground">Checklist de ações corretivas</span>
          </div>
          {loading && !analysis ? (
            <div className="flex items-center gap-2 text-base text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando ações...
            </div>
          ) : splitAnalysis(analysis).checklist.length > 0 ? (
            <ChecklistPanel items={splitAnalysis(analysis).checklist} />
          ) : (
            <p className="text-base text-muted-foreground">Nenhuma ação corretiva gerada ainda.</p>
          )}
        </div>
      </div>

      <GoalsTrendChart
        tabTitle={tabTitle}
        metrics={metrics}
        monthlyTargets={monthlyTargets}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      <AlertsPanel below={belowRef} above={aboveTarget} refLabel={alertThreshold} />
    </div>

  );
}
