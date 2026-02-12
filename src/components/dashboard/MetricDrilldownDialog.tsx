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
import { Pencil, Trash2, Check, X, Loader2, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
}

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

  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const { error } = await supabase
        .from("metric_history")
        .update({ value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metric_history"] });
      queryClient.invalidateQueries({ queryKey: ["metric_drilldown", metric.id] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
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
      queryClient.invalidateQueries({ queryKey: ["metric_history"] });
      queryClient.invalidateQueries({ queryKey: ["metric_drilldown", metric.id] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      setDeleteId(null);
      toast({ title: "Registro excluído", description: "O lançamento foi removido com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: sanitizeError(error), variant: "destructive" });
    },
  });

  const handleEdit = (entry: HistoryEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.value.toString());
  };

  const handleSave = (id: string) => {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) {
      toast({ title: "Valor inválido", description: "Insira um número válido.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id, value: numValue });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const hasActions = canEdit || canDelete;

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

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history && history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    {hasActions && <TableHead className="text-right w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="capitalize text-sm">
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
