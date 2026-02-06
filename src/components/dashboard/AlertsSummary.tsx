import { AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Metric } from "@/hooks/useMetrics";
import { formatMetricValue } from "@/utils/formatters";

interface AlertsSummaryProps {
  metrics: Metric[];
}

const inverseMetrics = ["Churn de Clientes", "Turnover"];

// Abbreviations for long metric names
const abbreviations: Record<string, string> = {
  "Receita Total Anual": "Receita Total",
  "Receita Área Empresarial": "Empresarial",
  "Receita Área Tributário": "Tributário",
  "Receita Área Trabalhista": "Trabalhista",
  "Receita Área Civil": "Civil",
  "Receita Área Ambiental": "Ambiental",
  "Receita Área Criminal": "Criminal",
  "Receita Área de Inovação": "Inovação",
  "Receita Área Correspondente": "Correspondente",
  "Margem Líquida": "Margem Líq.",
  "Margem Empresarial": "Margem Emp.",
  "Margem Tributário": "Margem Trib.",
  "Margem Trabalhista": "Margem Trab.",
  "Margem Civil": "Margem Civil",
  "Margem Ambiental": "Margem Amb.",
  "Margem Criminal": "Margem Crim.",
  "Margem de Inovação": "Margem Inov.",
  "Margem de Correspondente": "Margem Corresp.",
  "Ticket Médio Geral": "Ticket Geral",
  "Ticket Médio Empresarial": "Ticket Emp.",
  "Ticket Médio Tributário": "Ticket Trib.",
  "Ticket Médio Trabalhista": "Ticket Trab.",
  "Ticket Médio Civil": "Ticket Civil",
  "Ticket Médio Ambiental": "Ticket Amb.",
  "Ticket Médio Criminal": "Ticket Crim.",
  "Ticket Médio de Inovação": "Ticket Inov.",
  "Lead Time de Onboarding": "Lead Onboard.",
  "Lead Time de Entrega de Demandas": "Lead Demandas",
  "Taxa de Sucesso de Projetos": "Taxa Sucesso",
  "Taxa de Conversão de Funil Comercial": "Conv. Funil",
  "Custo Fixo Mensal": "Custo Fixo",
  "Folha sobre Receita": "Folha/Receita",
  "Taxa de Inadimplência": "Inadimplência",
  "Cumprimento do Orçamento": "Orçamento",
  "Contratos Empresarial": "Contr. Emp.",
  "Contratos Tributário": "Contr. Trib.",
  "Contratos Trabalhista": "Contr. Trab.",
  "Contratos Civil": "Contr. Civil",
  "Contratos Ambiental": "Contr. Amb.",
  "Contratos Criminal": "Contr. Crim.",
  "Contratos de Inovação": "Contr. Inov.",
  "Churn de Clientes": "Churn",
  "Taxa de Cumprimento de SLA": "SLA",
  "Receita por Advogado": "Receita/Adv.",
};

function getAbbreviatedName(name: string): string {
  return abbreviations[name] || (name.length > 18 ? name.substring(0, 16) + "…" : name);
}

function getStatus(metric: Metric) {
  const isInverse = inverseMetrics.includes(metric.name);
  const ratio = metric.current_value / metric.target_value;
  
  if (isInverse) {
    if (ratio <= 1) return "success";
    if (ratio <= 1.15) return "warning";
    return "danger";
  }
  
  if (ratio >= 1) return "success";
  if (ratio >= 0.85) return "warning";
  return "danger";
}

export function AlertsSummary({ metrics }: AlertsSummaryProps) {
  const alerts = metrics
    .map((metric) => ({
      metric,
      status: getStatus(metric),
    }))
    .filter((item) => item.status !== "success");

  const dangerCount = alerts.filter((a) => a.status === "danger").length;
  const warningCount = alerts.filter((a) => a.status === "warning").length;
  const successCount = metrics.length - alerts.length;

  if (alerts.length === 0) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-6 print:break-inside-avoid">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <div>
            <h3 className="font-semibold text-success">Todas as metas atingidas!</h3>
            <p className="text-sm text-success/80">
              Parabéns! Todas as {metrics.length} métricas estão dentro da meta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6 print:break-inside-avoid">
      <div className="flex items-center gap-3 mb-3">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <div>
          <h3 className="font-semibold text-foreground">Resumo de Alertas</h3>
          <p className="text-sm text-muted-foreground">
            {dangerCount > 0 && <span className="text-destructive font-medium">{dangerCount} crítico(s)</span>}
            {dangerCount > 0 && warningCount > 0 && " • "}
            {warningCount > 0 && <span className="text-warning font-medium">{warningCount} atenção</span>}
            {(dangerCount > 0 || warningCount > 0) && " • "}
            <span className="text-success font-medium">{successCount} OK</span>
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {alerts.map(({ metric, status }) => (
          <Popover key={metric.id}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
                  status === "danger" 
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20" 
                    : "bg-warning/10 text-warning hover:bg-warning/20"
                )}
              >
                <TrendingDown className="h-3 w-3" />
                <span>{getAbbreviatedName(metric.name)}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" side="top">
              <div className="text-sm">
                <p className="font-medium mb-1">{metric.name}</p>
                <p className={cn(
                  "font-semibold",
                  status === "danger" ? "text-destructive" : "text-warning"
                )}>
                  Atual: {formatMetricValue(metric.current_value, metric.unit, metric.name)}
                </p>
                <p className="text-muted-foreground">
                  Meta: {formatMetricValue(metric.target_value, metric.unit, metric.name)}
                </p>
              </div>
            </PopoverContent>
          </Popover>
        ))}
      </div>
    </div>
  );
}
