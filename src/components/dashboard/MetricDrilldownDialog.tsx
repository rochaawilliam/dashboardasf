import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/error-handler";
import { Pencil, Trash2, Check, X, Loader2, History, Plus, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/utils/dateUtils";
import type { Metric } from "@/hooks/useMetrics";
import { formatMetricValue, formatNumber } from "@/utils/formatters";
import { getRefMonthYear } from "@/utils/dateUtils";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from "recharts";

// All revenue component metric IDs that sum up to Receita Total Mensal
const ALL_REVENUE_COMPONENT_IDS = [
  "b3291022-409f-4679-bddc-bc687f3d9d68", // Emp Assessoria
  "560bece4-6e53-46be-add1-fa6dfdbdaaf7", // Emp Consultoria
  "de3186d7-1b20-41e2-8fd9-9fef114096bb", // Emp Pontual
  "be1fcc4f-c1b8-476a-b330-e2b8675ae458", // Trab Assessoria
  "33d2ab91-2534-4cb0-b21c-6a2d7fc628b1", // Trab Consultoria
  "f1fd7525-963f-401e-a1e1-7b449f022bbd", // Trab Pontual
  "b829cf12-3f66-4a0c-8753-70260a9645d8", // Trib Assessoria
  "847ce517-c118-46c9-9012-c69dfa5474d9", // Trib Consultoria
  "6122d0fc-e606-4020-afab-45658e063158", // Trib Pontual
  "c0a1fe29-7d31-424c-9f86-6766981dcd82", // Outras Receitas
];

interface CollaboratorBreakdown {
  name: string;
  value: number;
}

interface MetricDrilldownDialogProps {
  metric: Metric;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
  collaboratorData?: CollaboratorBreakdown[];
  collaboratorSuffix?: string;
}

interface HistoryEntry {
  id: string;
  metric_id: string;
  value: number;
  recorded_at: string;
  period_type: string;
  created_at: string;
  comment: string | null;
  source: string | null;
}

const isContractMetric = (name: string) =>
  name.toLowerCase().includes("novos contratos") && !name.toLowerCase().includes("off-line") && !name.toLowerCase().includes("on-line");

const isForecastMetric = (name: string) =>
  name === "Receita Total Mensal";

const isRevenueMetric = (name: string) =>
  name === "Receita Total Mensal";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function MetricDrilldownDialog({
  metric,
  open,
  onOpenChange,
  canEdit,
  canDelete,
  collaboratorData,
  collaboratorSuffix,
}: MetricDrilldownDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newMonth, setNewMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [newYear, setNewYear] = useState<string>(new Date().getFullYear().toString());
  const [newComment, setNewComment] = useState("");
  const [newSource, setNewSource] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editSource, setEditSource] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ["metric_drilldown", metric.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metric_history")
        .select("*")
        .eq("metric_id", metric.id)
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data as HistoryEntry[];
    },
    enabled: open,
  });

  // Fetch monthly targets for revenue chart
  const { data: monthlyTargetsData } = useQuery({
    queryKey: ["monthly_targets_drilldown", metric.id, filterYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_targets")
        .select("*")
        .eq("metric_id", metric.id)
        .eq("year", parseInt(filterYear));
      if (error) throw error;
      return data;
    },
    enabled: open && isRevenueMetric(metric.name),
  });

  // Fetch all revenue component history for the chart (Realizado = sum of all sub-metrics)
  const { data: revenueComponentHistory } = useQuery({
    queryKey: ["revenue_components_history", filterYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metric_history")
        .select("*")
        .in("metric_id", ALL_REVENUE_COMPONENT_IDS);
      if (error) throw error;
      return data as HistoryEntry[];
    },
    enabled: open && isRevenueMetric(metric.name),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["metric_history"] });
    queryClient.invalidateQueries({ queryKey: ["metric_drilldown", metric.id] });
    queryClient.invalidateQueries({ queryKey: ["metrics"] });
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, value, comment, source }: { id: string; value: number; comment?: string; source?: string | null }) => {
      const { error } = await supabase
        .from("metric_history")
        .update({ value, comment: comment ?? null, source: source ?? null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setEditingId(null);
      toast({ title: "Valor atualizado", description: "O registro foi atualizado com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: sanitizeError(error), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("metric_history")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setDeleteId(null);
      toast({ title: "Registro excluído", description: "O lançamento foi removido com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: sanitizeError(error), variant: "destructive" });
    },
  });

  const insertMutation = useMutation({
    mutationFn: async ({ value, month, year, comment, source }: { value: number; month: number; year: number; comment?: string; source?: string | null }) => {
      // recorded_at = today's date (actual date of the entry)
      const today = new Date();
      const recordedAt = format(today, "yyyy-MM-dd");
      // period_type stores the reference month as "YYYY-MM"
      const refPeriod = `${year}-${String(month).padStart(2, "0")}`;

      const { error } = await supabase
        .from("metric_history")
        .insert({
          metric_id: metric.id,
          value,
          recorded_at: recordedAt,
          period_type: refPeriod,
          comment: comment || null,
          source: source || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setShowNewEntry(false);
      setNewValue("");
      setNewComment("");
      setNewSource(null);
      toast({ title: "Lançamento criado", description: "O valor foi registrado com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar lançamento", description: sanitizeError(error), variant: "destructive" });
    },
  });


  const handleSave = (id: string) => {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) {
      toast({ title: "Valor inválido", description: "Insira um número válido.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id, value: numValue, comment: editComment.trim() || undefined, source: editSource });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
    setEditComment("");
  };

  const handleInsert = () => {
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) {
      toast({ title: "Valor inválido", description: "Insira um número válido.", variant: "destructive" });
      return;
    }
    insertMutation.mutate({ 
      value: numValue, 
      month: parseInt(newMonth), 
      year: parseInt(newYear),
      comment: newComment.trim() || undefined,
      source: newSource,
    });
  };

  const handleEdit = (entry: HistoryEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.value.toString());
    setEditComment(entry.comment || "");
    setEditSource(entry.source || null);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseLocalDate(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatRefPeriod = (periodType: string) => {
    // period_type is "YYYY-MM" for new entries, "monthly" for legacy
    if (periodType === "monthly" || !periodType.includes("-")) return "—";
    try {
      const [year, month] = periodType.split("-").map(Number);
      return MONTH_NAMES[month - 1] + "/" + year;
    } catch {
      return periodType;
    }
  };

  const hasActions = canEdit || canDelete;
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  // Filter history by selected month/year
  const filteredHistory = history?.filter((entry) => {
    if (filterMonth === "all") return true;
    if (entry.period_type && entry.period_type.includes("-")) {
      const [entryYear, entryMonth] = entry.period_type.split("-");
      return entryYear === filterYear && entryMonth === filterMonth.padStart(2, "0");
    }
    return true;
  });

  const filteredTotal = filteredHistory?.reduce((sum, e) => sum + Number(e.value), 0) ?? 0;

  // Monthly totals for the selected year
  const monthlyTotals = useMemo(() => {
    if (!history) return [];
    return MONTH_NAMES.map((name, i) => {
      const month = i + 1;
      const monthStr = String(month).padStart(2, "0");
      const total = history
        .filter((e) => e.period_type?.startsWith(`${filterYear}-${monthStr}`))
        .reduce((sum, e) => sum + Number(e.value), 0);
      return { month, name: name.substring(0, 3), total };
    });
  }, [history, filterYear]);

  // Revenue bar chart data: Previsto vs Realizado per month
  // Realizado = sum of all revenue component sub-metrics (same as the card value)
  const revenueChartData = useMemo(() => {
    if (!isRevenueMetric(metric.name)) return [];
    const year = parseInt(filterYear);
    return MONTH_NAMES.map((name, i) => {
      const month = i + 1;
      // Previsto from forecast entries on the Receita Total Mensal metric itself
      const monthStr = String(month).padStart(2, "0");
      const monthEntries = history?.filter((e) => e.period_type?.startsWith(`${filterYear}-${monthStr}`)) ?? [];
      const previsto = monthEntries
        .filter((e) => e.source === "forecast")
        .reduce((sum, e) => sum + Number(e.value), 0);
      // Realizado = sum of all revenue component history entries for this month
      let realizado = 0;
      revenueComponentHistory?.forEach((h) => {
        if (h.source === "forecast") return;
        const ref = getRefMonthYear(h.period_type, h.recorded_at);
        if (ref.year === year && ref.month === month) {
          realizado += Number(h.value);
        }
      });
      const target = monthlyTargetsData?.find((t) => t.month === month);
      const meta = target?.target_value ?? 0;
      return { name: name.substring(0, 3), meta, previsto, realizado };
    });
  }, [history, revenueComponentHistory, monthlyTargetsData, filterYear, metric.name]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" />
              {metric.name}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Meta anual: {formatMetricValue(metric.target_value, metric.unit, metric.name)}
            </p>
          </DialogHeader>

          {/* New entry form */}
          {canEdit && (
            <div className="border border-border rounded-lg p-3 bg-muted/30">
              {showNewEntry ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground">Novo Lançamento</p>
                  <div className="space-y-2">
                    <div className="flex items-end gap-2">
                      <div className="w-20">
                        <label className="text-[10px] text-muted-foreground">Ano</label>
                        <Select value={newYear} onValueChange={setNewYear}>
                          <SelectTrigger className="h-8 text-xs mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border border-border z-50">
                            {yearOptions.map((y) => (
                              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-[80px]">
                        <label className="text-[10px] text-muted-foreground">Valor ({metric.unit})</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          className="h-8 text-xs mt-0.5"
                          placeholder="0.00"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Mês de Referência</label>
                      <div className="grid grid-cols-4 gap-1" translate="no">
                        {MONTH_NAMES.map((name, i) => {
                          const monthValue = (i + 1).toString();
                          const isSelected = newMonth === monthValue;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setNewMonth(monthValue)}
                              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors border ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                              }`}
                            >
                              {name.substring(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Comentário (opcional)</label>
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="h-8 text-xs mt-0.5"
                      placeholder="Breve descrição do lançamento..."
                      maxLength={200}
                    />
                  </div>
                   {isForecastMetric(metric.name) && (
                     <div>
                       <label className="text-[10px] text-muted-foreground mb-1 block">Tipo de Lançamento</label>
                       <div className="flex gap-2">
                         {[{ value: null, label: "Realizado" }, { value: "forecast", label: "Previsto" }].map((opt) => (
                           <button
                             key={opt.value ?? "realizado"}
                             type="button"
                             onClick={() => setNewSource(opt.value)}
                             className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors border ${
                               newSource === opt.value
                                 ? "bg-primary text-primary-foreground border-primary"
                                 : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                             }`}
                           >
                             {opt.label}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                   {isContractMetric(metric.name) && (
                     <div>
                       <label className="text-[10px] text-muted-foreground mb-1 block">Origem do Contrato</label>
                       <div className="flex gap-2">
                         {[{ value: "online", label: "On-line" }, { value: "offline", label: "Off-line" }].map((opt) => (
                           <button
                             key={opt.value}
                             type="button"
                             onClick={() => setNewSource(newSource === opt.value ? null : opt.value)}
                             className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors border ${
                               newSource === opt.value
                                 ? "bg-primary text-primary-foreground border-primary"
                                 : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                             }`}
                           >
                             {opt.label}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleInsert}
                      disabled={insertMutation.isPending || !newValue}
                      className="h-7 text-xs gap-1"
                    >
                      {insertMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setShowNewEntry(false); setNewValue(""); setNewComment(""); setNewSource(null); }}
                      className="h-7 text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewEntry(true)}
                  className="h-7 text-xs gap-1 w-full text-primary hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Novo Lançamento
                </Button>
              )}
            </div>
          )}

          {/* Month filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>Filtrar:</span>
            </div>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 flex-wrap" translate="no">
              <button
                type="button"
                onClick={() => setFilterMonth("all")}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors border ${
                  filterMonth === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                Todos
              </button>
              {MONTH_NAMES.map((name, i) => {
                const monthValue = (i + 1).toString();
                const isSelected = filterMonth === monthValue;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFilterMonth(monthValue)}
                    className={`rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {name.substring(0, 3)}
                  </button>
                );
              })}
            </div>
            {filterMonth !== "all" && filteredHistory && filteredHistory.length > 0 && (
              <span className="text-xs font-medium text-primary ml-auto">
                Total: {formatMetricValue(filteredTotal, metric.unit, metric.name)}
              </span>
            )}
          </div>

          {/* Monthly totals grid */}
          {!isLoading && history && history.length > 0 && (
            <div className="border border-border rounded-lg p-2 bg-muted/20">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Totais por mês — {filterYear}</p>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1" translate="no">
                {monthlyTotals.map((m) => {
                  const hasValue = m.total > 0;
                  const isActive = filterMonth === String(m.month);
                  return (
                    <button
                      key={m.month}
                      type="button"
                      onClick={() => setFilterMonth(isActive ? "all" : String(m.month))}
                      className={`rounded-md p-1 text-center transition-colors border ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : hasValue
                          ? "bg-success/10 border-success/30 hover:bg-success/20"
                          : "bg-background border-border hover:bg-accent"
                      }`}
                    >
                      <span className="text-[9px] font-medium block">{m.name}</span>
                      <span className={`text-[10px] font-semibold block ${
                        isActive ? "text-primary-foreground" : hasValue ? "text-success" : "text-muted-foreground"
                      }`}>
                        {hasValue ? formatMetricValue(m.total, metric.unit, metric.name) : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-collaborator breakdown for training metrics */}
          {collaboratorData && collaboratorData.length > 0 && (
            <div className="border border-border rounded-lg p-2 bg-muted/20">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Por Colaborador</p>
              <div className="space-y-1">
                {[...collaboratorData].sort((a, b) => b.value - a.value).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs px-1 py-0.5 rounded hover:bg-muted/40">
                    <span className="text-foreground truncate mr-2">{c.name}</span>
                    <span className="font-medium text-foreground whitespace-nowrap">
                      {c.value}{collaboratorSuffix || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Revenue chart: Previsto + Realizado (bars) + Meta (line) */}
          {isRevenueMetric(metric.name) && revenueChartData.length > 0 && (
            <div className="border border-border rounded-lg p-3 bg-muted/20">
              <p className="text-[10px] font-medium text-muted-foreground mb-2">Previsto vs Realizado vs Meta — {filterYear}</p>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={revenueChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "hsl(var(--popover-foreground))",
                    }}
                    formatter={(value: number, name: string) => [formatMetricValue(value, metric.unit, metric.name), name]}
                    labelFormatter={(label) => `${label}/${filterYear}`}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="previsto" name="Previsto" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} barSize={16} />
                  <Bar dataKey="realizado" name="Realizado" radius={[3, 3, 0, 0]} barSize={16}>
                    {revenueChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.realizado >= entry.meta ? "hsl(142, 65%, 38%)" : "hsl(var(--primary))"}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="meta"
                    name="Meta"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--destructive))", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredHistory && filteredHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Lançado em</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                     {isContractMetric(metric.name) && <TableHead>Origem</TableHead>}
                     {isForecastMetric(metric.name) && <TableHead>Tipo</TableHead>}
                     <TableHead>Comentário</TableHead>
                    {hasActions && <TableHead className="text-right w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="capitalize text-xs whitespace-nowrap">
                        {formatRefPeriod(entry.period_type)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(entry.recorded_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === entry.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 ml-auto text-right h-8 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {formatMetricValue(entry.value, metric.unit, metric.name)}
                          </span>
                        )}
                      </TableCell>
                      {isContractMetric(metric.name) && (
                        <TableCell>
                          {editingId === entry.id ? (
                            <div className="flex gap-1">
                              {[{ value: "online", label: "On" }, { value: "offline", label: "Off" }].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setEditSource(editSource === opt.value ? null : opt.value)}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium border transition-colors ${
                                    editSource === opt.value
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              entry.source === "online" ? "bg-primary/10 text-primary" :
                              entry.source === "offline" ? "bg-warning/10 text-warning" :
                              "text-muted-foreground"
                            }`}>
                              {entry.source === "online" ? "On-line" : entry.source === "offline" ? "Off-line" : "—"}
                            </span>
                          )}
                        </TableCell>
                      )}
                      {isForecastMetric(metric.name) && (
                        <TableCell>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            entry.source === "forecast" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                          }`}>
                            {entry.source === "forecast" ? "Previsto" : "Realizado"}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="max-w-[150px]">
                        {editingId === entry.id ? (
                          <Input
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            className="h-8 text-xs"
                            placeholder="Comentário..."
                            maxLength={200}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground truncate block">
                            {entry.comment || "—"}
                          </span>
                        )}
                      </TableCell>
                      {hasActions && (
                        <TableCell className="text-right">
                          {editingId === entry.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleSave(entry.id)}
                                disabled={updateMutation.isPending}
                                className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCancel}
                                className="h-7 w-7 text-muted-foreground"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              {canEdit && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEdit(entry)}
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setDeleteId(entry.id)}
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <History className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">Nenhum lançamento encontrado</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
