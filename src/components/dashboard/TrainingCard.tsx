import { Clock } from "lucide-react";

interface TrainingItem {
  role: string;
  hours: number;
  target: number;
}

interface TrainingCardProps {
  items: TrainingItem[];
}

export function TrainingCard({ items }: TrainingCardProps) {
  return (
    <div className="metric-card col-span-full lg:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">
          Horas de Treinamento
        </h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => {
          const progress = (item.hours / item.target) * 100;
          const status = progress >= 100 ? "success" : progress >= 75 ? "warning" : "danger";
          
          return (
            <div key={item.role} className="bg-muted/30 rounded-xl p-3">
              <span className="text-xs text-muted-foreground block mb-2">
                {item.role}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold text-foreground">
                  {item.hours}
                </span>
                <span className="text-xs text-muted-foreground">/{item.target}h</span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    status === "success"
                      ? "bg-success"
                      : status === "warning"
                      ? "bg-warning"
                      : "bg-destructive"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
