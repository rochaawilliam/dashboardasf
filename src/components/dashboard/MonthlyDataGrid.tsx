import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react";
import type { Metric, MetricHistory } from "@/hooks/useMetrics";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface MonthlyDataGridProps {
  metrics: Metric[];
  historyData: MetricHistory[];
}

const months = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez"
];

const monthLabels: Record<string, string> = {
  jan: "Janeiro", fev: "Fevereiro", mar: "Março", abr: "Abril",
  mai: "Maio", jun: "Junho", jul: "Julho", ago: "Agosto",
  set: "Setembro", out: "Outubro", nov: "Novembro", dez: "Dezembro"
};

interface MonthData {
  month: string;
  year: number;
  value: number | null;
  historyId: string | null;
  recorded_at: string | null;
}

interface YearData {
  year: number;
  months: MonthData[];
  total: number;
}

export function MonthlyDataGrid({ metrics, historyData }: MonthlyDataGridProps) {
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [editingCell, setEditingCell] = useState<{ year: number; month: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const queryClient = useQueryClient();

  // Get unique years from history data
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearSet.add(currentYear);
    
    historyData.forEach((h) => {
      const date = parseISO(h.recorded_at);
      yearSet.add(date.getFullYear());
    });
    
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [historyData]);

  // Initialize expanded years
  useMemo(() => {
    if (years.length > 0 && Object.keys(expandedYears).length === 0) {
      setExpandedYears({ [years[0]]: true });
    }
  }, [years]);

  // Build data structure for the selected metric
  const metricYearData = useMemo(() => {
    if (!selectedMetric) return [];

    const metricHistory = historyData.filter((h) => h.metric_id === selectedMetric.id);
    
    return years.map((year): YearData => {
      const monthsData = months.map((month, idx): MonthData => {
        const monthNum = idx + 1;
        const entry = metricHistory.find((h) => {
          const date = parseISO(h.recorded_at);
          return date.getFullYear() === year && date.getMonth() + 1 === monthNum;
        });
        
        return {
          month,
          year,
          value: entry ? entry.value : null,
          historyId: entry ? entry.id : null,
          recorded_at: entry ? entry.recorded_at : null,
        };
      });

      const total = monthsData.reduce((sum, m) => sum + (m.value || 0), 0);

      return { year, months: monthsData, total };
    });
  }, [selectedMetric, historyData, years]);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const saveHistoryMutation = useMutation({
    mutationFn: async ({ 
      metricId, 
      value, 
      recordedAt, 
      historyId 
    }: { 
      metricId: string; 
      value: number; 
      recordedAt: string;
      historyId: string | null;
    }) => {
      if (historyId) {
        // Update existing
        const { error } = await supabase
          .from("metric_history")
          .update({ value })
          .eq("id", historyId);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("metric_history")
          .insert({
            metric_id: metricId,
            value,
            recorded_at: recordedAt,
            period_type: "monthly",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metric_history"] });
      toast({ title: "Valor salvo", description: "O lançamento foi atualizado." });
      setEditingCell(null);
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveEdit = (monthData: MonthData) => {
    if (!selectedMetric) return;
    
    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }

    const recordedAt = monthData.recorded_at || 
      `${monthData.year}-${String(months.indexOf(monthData.month) + 1).padStart(2, "0")}-15`;

    saveHistoryMutation.mutate({
      metricId: selectedMetric.id,
      value: numValue,
      recordedAt,
      historyId: monthData.historyId,
    });
  };

  const startEditing = (year: number, month: string, currentValue: number | null) => {
    setEditingCell({ year, month });
    setEditValue(currentValue?.toString() || "");
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const getStatusColor = (value: number | null, target: number, isInverse: boolean) => {
    if (value === null) return "bg-muted text-muted-foreground";
    
    // Monthly target is annual target / 12
    const monthlyTarget = target / 12;
    const ratio = value / monthlyTarget;
    
    if (isInverse) {
      if (ratio <= 1) return "bg-success/20 text-success border-success/30";
      if (ratio <= 1.2) return "bg-warning/20 text-warning border-warning/30";
      return "bg-destructive/20 text-destructive border-destructive/30";
    }
    
    if (ratio >= 1) return "bg-success/20 text-success border-success/30";
    if (ratio >= 0.8) return "bg-warning/20 text-warning border-warning/30";
    return "bg-destructive/20 text-destructive border-destructive/30";
  };

  const inverseMetrics = ["Churn de Clientes", "Turnover"];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          📊 Lançamentos Mensais por Indicador
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Metric Selection */}
        <div className="flex flex-wrap gap-2 mb-6">
          {metrics.map((metric) => (
            <Button
              key={metric.id}
              variant={selectedMetric?.id === metric.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric(metric)}
              className="text-xs"
            >
              {metric.name}
            </Button>
          ))}
        </div>

        {selectedMetric && (
          <div className="space-y-4">
            {/* Target Info */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Meta Anual:</span>
              <span className="font-semibold">{selectedMetric.target_value}{selectedMetric.unit}</span>
              <span className="text-sm text-muted-foreground ml-4">Meta Mensal:</span>
              <span className="font-semibold">{(selectedMetric.target_value / 12).toFixed(2)}{selectedMetric.unit}</span>
            </div>

            {/* Years Grid */}
            {metricYearData.map((yearData) => (
              <div key={yearData.year} className="border rounded-lg overflow-hidden">
                {/* Year Header */}
                <button
                  onClick={() => toggleYear(yearData.year)}
                  className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedYears[yearData.year] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-semibold">{yearData.year}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Acumulado: <span className="font-medium text-foreground">{yearData.total.toFixed(2)}{selectedMetric.unit}</span>
                  </span>
                </button>

                {/* Months Grid */}
                {expandedYears[yearData.year] && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 p-3 bg-muted/30">
                    {yearData.months.map((monthData) => {
                      const isEditing = editingCell?.year === yearData.year && editingCell?.month === monthData.month;
                      const isInverse = inverseMetrics.includes(selectedMetric.name);
                      
                      return (
                        <div
                          key={monthData.month}
                          className={cn(
                            "relative group p-2 rounded-lg border text-center transition-all",
                            getStatusColor(monthData.value, selectedMetric.target_value, isInverse)
                          )}
                        >
                          <div className="text-xs font-medium uppercase mb-1 opacity-70">
                            {monthData.month}
                          </div>
                          
                          {isEditing ? (
                            <div className="flex flex-col gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 text-xs text-center"
                                autoFocus
                              />
                              <div className="flex justify-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5"
                                  onClick={() => handleSaveEdit(monthData)}
                                  disabled={saveHistoryMutation.isPending}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm font-semibold">
                                {monthData.value !== null ? `${monthData.value}` : "—"}
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => startEditing(yearData.year, monthData.month, monthData.value)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!selectedMetric && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Selecione um indicador acima para visualizar os lançamentos mensais
          </p>
        )}
      </CardContent>
    </Card>
  );
}
