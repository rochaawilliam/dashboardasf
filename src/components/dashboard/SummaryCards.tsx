import { Target, TrendingUp, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryItem {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  color: string;
}

const summaryData: SummaryItem[] = [
  {
    label: "Cumprimento Orçamento",
    value: "95%",
    change: "+2.5%",
    changeType: "positive",
    icon: Target,
    color: "bg-primary text-primary-foreground",
  },
  {
    label: "NPS",
    value: "76",
    change: "+4 pts",
    changeType: "positive",
    icon: TrendingUp,
    color: "bg-success text-success-foreground",
  },
  {
    label: "Churn de Clientes",
    value: "3.75%",
    change: "-0.5%",
    changeType: "positive",
    icon: Users,
    color: "bg-accent text-accent-foreground",
  },
  {
    label: "Capacidade Ocupada",
    value: "80%",
    change: "No alvo",
    changeType: "neutral",
    icon: Zap,
    color: "bg-warning text-warning-foreground",
  },
];

export function SummaryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {summaryData.map((item) => (
        <div
          key={item.label}
          className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className={cn("p-2 rounded-lg", item.color)}>
              <item.icon className="h-5 w-5" />
            </div>
            {item.change && (
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-full",
                  item.changeType === "positive" && "bg-success/10 text-success",
                  item.changeType === "negative" && "bg-destructive/10 text-destructive",
                  item.changeType === "neutral" && "bg-muted text-muted-foreground"
                )}
              >
                {item.change}
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="metric-value">{item.value}</p>
            <p className="metric-sublabel normal-case mt-1">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
