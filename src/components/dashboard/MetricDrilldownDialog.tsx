import { useState } from "react";
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
import { Pencil, Trash2, Check, X, Loader2, History, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/utils/dateUtils";
import type { Metric } from "@/hooks/useMetrics";
import { formatMetricValue } from "@/utils/formatters";

interface MetricDrilldownDialogProps {
  metric: Metric;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canDelete: boolean;
}

interface HistoryEntry {
  id: string;
  metric_id: string;
  value: number;
  recorded_at: string;
  period_type: string;
  created_at: string;
  comment: string | null;
}

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
}: MetricDrilldownDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newMonth, setNewMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [newDay, setNewDay] = useState<string>(new Date().getDate().toString());
  const [newYear, setNewYear] = useState<string>(new Date().getFullYear().toString());
  const [newComment, setNewComment] = useState("");
  const [editComment, setEditComment] = useState("");
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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["metric_history"] });
    queryClient.invalidateQueries({ queryKey: ["metric_drilldown", metric.id] });
    queryClient.invalidateQueries({ queryKey: ["metrics"] });
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, value, comment }: { id: string; value: number; comment?: string }) => {
      const { error } = await supabase
        .from("metric_history")
        .update({ value, comment: comment ?? null } as any)
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
    mutationFn: async ({ value, month, day, year, comment }: { value: number; month: number; day: number; year: number; comment?: string }) => {
      const recordedAt = format(new Date(year, month - 1, day), "yyyy-MM-dd");

      const { error } = await supabase
        .from("metric_history")
        .insert({
          metric_id: metric.id,
          value,
          recorded_at: recordedAt,
          period_type: "monthly",
          comment: comment || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setShowNewEntry(false);
      setNewValue("");
      setNewComment("");
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
    updateMutation.mutate({ id, value: numValue, comment: editComment.trim() || undefined });
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
      day: parseInt(newDay),
      year: parseInt(newYear),
      comment: newComment.trim() || undefined,
    });
  };

  const handleEdit = (entry: HistoryEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.value.toString());
    setEditComment(entry.comment || "");
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseLocalDate(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const hasActions = canEdit || canDelete;
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

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
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="w-16">
                      <label className="text-[10px] text-muted-foreground">Dia</label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={newDay}
                        onChange={(e) => setNewDay(e.target.value)}
                        className="h-8 text-xs mt-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <label className="text-[10px] text-muted-foreground">Mês</label>
                      <Select value={newMonth} onValueChange={setNewMonth}>
                        <SelectTrigger className="h-8 text-xs mt-0.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTH_NAMES.map((name, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <label className="text-[10px] text-muted-foreground">Ano</label>
                      <Select value={newYear} onValueChange={setNewYear}>
                        <SelectTrigger className="h-8 text-xs mt-0.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                    <label className="text-[10px] text-muted-foreground">Comentário (opcional)</label>
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="h-8 text-xs mt-0.5"
                      placeholder="Breve descrição do lançamento..."
                      maxLength={200}
                    />
                  </div>
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
                      onClick={() => { setShowNewEntry(false); setNewValue(""); setNewComment(""); }}
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

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history && history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Comentário</TableHead>
                    {hasActions && <TableHead className="text-right w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="capitalize text-sm whitespace-nowrap">
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
