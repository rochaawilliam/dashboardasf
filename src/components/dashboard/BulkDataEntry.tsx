import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileSpreadsheet, Upload, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeError } from "@/lib/error-handler";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { Metric, TrainingHours } from "@/hooks/useMetrics";

interface BulkDataEntryProps {
  metrics: Metric[];
  trainingHours: TrainingHours[];
}

interface MetricEntry {
  id: string;
  name: string;
  unit: string;
  target: number;
  value: string;
  status: "pending" | "valid" | "invalid";
}

interface TrainingEntry {
  id: string;
  role: string;
  target: number;
  value: string;
  status: "pending" | "valid" | "invalid";
}

export function BulkDataEntry({ metrics, trainingHours }: BulkDataEntryProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entries, setEntries] = useState<MetricEntry[]>(() =>
    metrics.map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      target: m.target_value,
      value: "",
      status: "pending" as const,
    }))
  );
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>(() =>
    trainingHours.map((t) => ({
      id: t.id,
      role: t.role,
      target: t.target_hours,
      value: "",
      status: "pending" as const,
    }))
  );

  const queryClient = useQueryClient();

  const updateEntry = (id: string, value: string) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        const numValue = parseFloat(value);
        const status = value === "" ? "pending" : isNaN(numValue) ? "invalid" : "valid";
        return { ...entry, value, status };
      })
    );
  };

  const updateTrainingEntry = (id: string, value: string) => {
    setTrainingEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        const numValue = parseFloat(value);
        const status = value === "" ? "pending" : isNaN(numValue) ? "invalid" : "valid";
        return { ...entry, value, status };
      })
    );
  };

  const handleSubmit = async () => {
    const validEntries = entries.filter((e) => e.status === "valid");
    const validTraining = trainingEntries.filter((e) => e.status === "valid");

    if (validEntries.length === 0 && validTraining.length === 0) {
      toast({
        title: "Nenhum dado válido",
        description: "Preencha pelo menos um campo para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert metric history
      if (validEntries.length > 0) {
        const historyData = validEntries.map((entry) => ({
          metric_id: entry.id,
          value: parseFloat(entry.value),
          recorded_at: format(date, "yyyy-MM-dd"),
          period_type: "monthly",
        }));

        const { error: historyError } = await supabase
          .from("metric_history")
          .insert(historyData);

        if (historyError) throw historyError;

        // Update current values
        for (const entry of validEntries) {
          await supabase
            .from("metrics")
            .update({ current_value: parseFloat(entry.value) })
            .eq("id", entry.id);
        }
      }

      // Update training hours
      for (const entry of validTraining) {
        await supabase
          .from("training_hours")
          .update({ current_hours: parseFloat(entry.value) })
          .eq("id", entry.id);
      }

      toast({
        title: "Dados lançados",
        description: `${validEntries.length} métricas e ${validTraining.length} horas de treinamento atualizadas.`,
      });

      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      queryClient.invalidateQueries({ queryKey: ["metric_history"] });
      queryClient.invalidateQueries({ queryKey: ["training_hours"] });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: sanitizeError(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filledCount = entries.filter((e) => e.status === "valid").length + 
                      trainingEntries.filter((e) => e.status === "valid").length;
  const totalCount = entries.length + trainingEntries.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Lançamento em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Lançamento Mensal em Lote
          </DialogTitle>
          <DialogDescription>
            Preencha os valores realizados de todas as métricas para o mês selecionado.
          </DialogDescription>
        </DialogHeader>

        {/* Date Selection */}
        <div className="flex items-center gap-4 py-2 border-b">
          <Label className="whitespace-nowrap">Mês de Referência:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border border-border z-50">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className="pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <span className="text-sm text-muted-foreground ml-auto">
            {filledCount}/{totalCount} preenchidos
          </span>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Metrics Section */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              Métricas
            </h3>
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Meta: {entry.target}{entry.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      className="w-24 h-9"
                      value={entry.value}
                      onChange={(e) => updateEntry(entry.id, e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground w-12">
                      {entry.unit}
                    </span>
                    {entry.status === "valid" && (
                      <Check className="h-4 w-4 text-success" />
                    )}
                    {entry.status === "invalid" && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Training Hours Section */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              Horas de Treinamento
            </h3>
            <div className="space-y-3">
              {trainingEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.role}</p>
                    <p className="text-xs text-muted-foreground">
                      Meta: {entry.target} hrs
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Horas"
                      className="w-24 h-9"
                      value={entry.value}
                      onChange={(e) => updateTrainingEntry(entry.id, e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground w-12">hrs</span>
                    {entry.status === "valid" && (
                      <Check className="h-4 w-4 text-success" />
                    )}
                    {entry.status === "invalid" && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Apenas campos preenchidos serão salvos
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || filledCount === 0}>
              {isSubmitting ? "Salvando..." : `Salvar ${filledCount} itens`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
