import { useState, useEffect } from "react";
import { Check, X, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateMetric, type Metric } from "@/hooks/useMetrics";
import { formatMetricValue } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface MetricGoalEditorProps {
  metric: Metric;
}

export function MetricGoalEditor({ metric }: MetricGoalEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [targetValue, setTargetValue] = useState(metric.target_value.toString());

  useEffect(() => {
    if (!isEditing) {
      setTargetValue(metric.target_value.toString());
    }
  }, [metric.target_value, isEditing]);
  
  const updateMetric = useUpdateMetric();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    const newTarget = parseFloat(targetValue);
    
    // Update the annual target
    updateMetric.mutate({
      id: metric.id,
      target_value: newTarget,
    });

    // Also update all monthly targets for current and next year
    // For percentage metrics, monthly = annual; for cumulative, monthly = annual/12
    const isPercentageOrRate = metric.unit === "%" || metric.unit === "x" || metric.name.toLowerCase().includes("taxa") || metric.name.toLowerCase().includes("nps") || metric.name.toLowerCase().includes("enps");
    const monthlyValue = isPercentageOrRate ? newTarget : newTarget / 12;

    const currentYear = new Date().getFullYear();
    for (const year of [currentYear, currentYear + 1]) {
      for (let month = 1; month <= 12; month++) {
        await supabase
          .from("monthly_targets")
          .upsert(
            { metric_id: metric.id, year, month, target_value: monthlyValue },
            { onConflict: "metric_id,year,month" }
          );
      }
    }
    queryClient.invalidateQueries({ queryKey: ["monthly_targets"] });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTargetValue(metric.target_value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
      {metric.polarity === "lower_is_better" ? (
        <TrendingDown className="h-3.5 w-3.5 shrink-0 text-blue-400" />
      ) : (
        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      )}
      <span className="flex-1 text-xs font-medium text-foreground truncate" title={metric.name}>
        {metric.name}
      </span>
      
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.01"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 w-24 text-xs"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-success hover:text-success"
            onClick={handleSave}
            disabled={updateMetric.isPending}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={handleCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors min-w-[60px] text-right"
        >
          {formatMetricValue(metric.target_value, metric.unit, metric.name)}
        </button>
      )}
    </div>
  );
}
