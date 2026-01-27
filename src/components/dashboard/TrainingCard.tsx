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
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          Horas de Treinamento por Colaborador
        </h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => {
          const progress = (item.hours / item.target) * 100;
          const status = progress >= 100 ? "success" : progress >= 75 ? "warning" : "danger";
          
          return (
            <div key={item.role} className="bg-muted/50 rounded-lg p-4">
              <span className="text-sm font-medium text-muted-foreground block mb-2">
                {item.role}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">
                  {item.hours.toString().padStart(2, "0")}
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
                Meta: {item.target}hrs
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
