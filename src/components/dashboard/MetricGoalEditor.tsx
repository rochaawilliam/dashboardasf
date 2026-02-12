import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateMetric, type Metric } from "@/hooks/useMetrics";
import { formatMetricValue } from "@/utils/formatters";

interface MetricGoalEditorProps {
  metric: Metric;
}

export function MetricGoalEditor({ metric }: MetricGoalEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [targetValue, setTargetValue] = useState(metric.target_value.toString());
  
  const updateMetric = useUpdateMetric();

  const handleSave = () => {
    updateMetric.mutate({
      id: metric.id,
      target_value: parseFloat(targetValue),
    });
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
