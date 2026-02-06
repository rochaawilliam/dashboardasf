import { useState } from "react";
import { Clock, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateTrainingHours, type TrainingHours } from "@/hooks/useMetrics";
import { formatNumber } from "@/utils/formatters";

interface TrainingCardEditableProps {
  items: TrainingHours[];
}

function TrainingItem({ item }: { item: TrainingHours }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentHours, setCurrentHours] = useState(item.current_hours.toString());
  const [targetHours, setTargetHours] = useState(item.target_hours.toString());
  
  const updateTraining = useUpdateTrainingHours();
  
  const progress = (item.current_hours / item.target_hours) * 100;
  const status = progress >= 100 ? "success" : progress >= 75 ? "warning" : "danger";

  const handleSave = () => {
    updateTraining.mutate({
      id: item.id,
      current_hours: parseFloat(currentHours),
      target_hours: parseFloat(targetHours),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentHours(item.current_hours.toString());
    setTargetHours(item.target_hours.toString());
    setIsEditing(false);
  };

  return (
    <div className="bg-muted/50 rounded-lg p-4 group relative">
      {!isEditing && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
      
      <span className="text-sm font-medium text-muted-foreground block mb-2">
        {item.role}
      </span>
      
      {isEditing ? (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">Atual</label>
            <Input
              type="number"
              step="0.5"
              value={currentHours}
              onChange={(e) => setCurrentHours(e.target.value)}
              className="h-8 mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Meta</label>
            <Input
              type="number"
              step="0.5"
              value={targetHours}
              onChange={(e) => setTargetHours(e.target.value)}
              className="h-8 mt-1"
            />
          </div>
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-success hover:text-success"
              onClick={handleSave}
              disabled={updateTraining.isPending}
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
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">
              {formatNumber(item.current_hours, 0)}
            </span>
            <span className="text-sm text-muted-foreground">hrs</span>
          </div>
          <div className="mt-2 progress-bar">
            <div
              className={`progress-fill ${
                status === "success"
                  ? "bg-success"
                  : status === "warning"
                  ? "bg-warning"
                  : "bg-destructive"
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">
            Meta: {formatNumber(item.target_hours, 0)}hrs
          </span>
        </>
      )}
    </div>
  );
}

export function TrainingCardEditable({ items }: TrainingCardEditableProps) {
  return (
    <div className="metric-card col-span-full lg:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          Horas de Treinamento por Colaborador
        </h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <TrainingItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
