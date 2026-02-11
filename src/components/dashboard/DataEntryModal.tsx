import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, X } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Metric } from "@/hooks/useMetrics";

interface DataEntryModalProps {
  metrics: Metric[];
}

export function DataEntryModal({ metrics }: DataEntryModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!selectedMetric || !value || !date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert into metric_history
      const { error: historyError } = await supabase
        .from("metric_history")
        .insert({
          metric_id: selectedMetric,
          value: parseFloat(value),
          recorded_at: format(date, "yyyy-MM-dd"),
          period_type: "monthly",
        });

      if (historyError) throw historyError;

      // Also update current_value in metrics table
      const { error: metricError } = await supabase
        .from("metrics")
        .update({ current_value: parseFloat(value) })
        .eq("id", selectedMetric);

      if (metricError) throw metricError;

      toast({
        title: "Dados lançados",
        description: "Os valores foram salvos com sucesso.",
      });

      // Reset form
      setSelectedMetric("");
      setValue("");
      setDate(undefined);
      setOpen(false);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      queryClient.invalidateQueries({ queryKey: ["metric_history"] });
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

  const selectedMetricData = metrics.find((m) => m.id === selectedMetric);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Lançar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Lançamento de Dados Mensais</DialogTitle>
          <DialogDescription>
            Insira os valores realizados para atualizar as métricas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Metric Selection */}
          <div className="grid gap-2">
            <Label htmlFor="metric">Métrica</Label>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione uma métrica" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                {metrics.map((metric) => (
                  <SelectItem key={metric.id} value={metric.id}>
                    {metric.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMetricData && (
              <p className="text-xs text-muted-foreground">
                Meta atual: {selectedMetricData.target_value}
                {selectedMetricData.unit} | Valor atual:{" "}
                {selectedMetricData.current_value}
                {selectedMetricData.unit}
              </p>
            )}
          </div>

          {/* Value Input */}
          <div className="grid gap-2">
            <Label htmlFor="value">
              Valor Realizado {selectedMetricData?.unit && `(${selectedMetricData.unit.trim()})`}
            </Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              placeholder="Ex: 95.5"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          {/* Date Picker */}
          <div className="grid gap-2">
            <Label>Mês de Referência</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione o mês</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border border-border z-50" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
