import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, FilePlus, FileEdit, Trash2, Target, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_value: any;
  new_value: any;
  user_id: string | null;
  metric_name: string | null;
  metric_unit: string | null;
  description: string | null;
  user_display_name: string | null;
  created_at: string;
}

const actionConfig = {
  create: {
    icon: FilePlus,
    label: "Criação",
    color: "text-success",
    bgColor: "bg-success/10",
    badgeVariant: "default" as const,
  },
  update: {
    icon: FileEdit,
    label: "Edição",
    color: "text-warning",
    bgColor: "bg-warning/10",
    badgeVariant: "secondary" as const,
  },
  delete: {
    icon: Trash2,
    label: "Exclusão",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    badgeVariant: "destructive" as const,
  },
};

const tableLabels: Record<string, string> = {
  metric_history: "Lançamento",
  monthly_targets: "Meta",
};

export function RecentActivity() {
  const { user } = useAuth();

  const { data: auditEntries, isLoading } = useQuery({
    queryKey: ["audit_log", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!user,
  });

  const formatChangeDetail = (entry: AuditLogEntry) => {
    if (entry.table_name === "metric_history") {
      if (entry.action === "create" && entry.new_value) {
        return `Valor: ${entry.new_value.value}${entry.metric_unit ? ` ${entry.metric_unit}` : ""}`;
      }
      if (entry.action === "update" && entry.old_value && entry.new_value) {
        return `${entry.old_value.value} → ${entry.new_value.value}${entry.metric_unit ? ` ${entry.metric_unit}` : ""}`;
      }
      if (entry.action === "delete" && entry.old_value) {
        return `Valor removido: ${entry.old_value.value}${entry.metric_unit ? ` ${entry.metric_unit}` : ""}`;
      }
    }
    if (entry.table_name === "monthly_targets") {
      if (entry.action === "update" && entry.old_value && entry.new_value) {
        const monthNames = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const month = monthNames[entry.new_value.month] || "";
        return `${month}/${entry.new_value.year}: ${entry.old_value.target_value} → ${entry.new_value.target_value}`;
      }
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Histórico de Alterações
        </CardTitle>
        <CardDescription>Registro completo de criações, edições e exclusões no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !auditEntries?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma alteração registrada ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {auditEntries.map((entry) => {
              const config = actionConfig[entry.action as keyof typeof actionConfig] || actionConfig.update;
              const Icon = config.icon;
              const tableLabel = tableLabels[entry.table_name] || entry.table_name;
              const changeDetail = formatChangeDetail(entry);
              const isTarget = entry.table_name === "monthly_targets";

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn("mt-0.5 rounded-full p-2", config.bgColor)}>
                    {isTarget ? (
                      <Target className={cn("h-4 w-4", config.color)} />
                    ) : (
                      <Icon className={cn("h-4 w-4", config.color)} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {entry.metric_name || "Métrica"}
                      </p>
                      <Badge variant={config.badgeVariant} className="text-[10px] h-4 px-1.5">
                        {config.label}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        {tableLabel}
                      </Badge>
                    </div>
                    {changeDetail && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {changeDetail}
                      </p>
                    )}
                    {entry.new_value?.comment && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">
                        — {entry.new_value.comment}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {entry.user_display_name && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {entry.user_display_name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(entry.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
