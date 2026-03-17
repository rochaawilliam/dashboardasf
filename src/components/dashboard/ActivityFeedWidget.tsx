import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, Clock, FilePlus, FileEdit, Trash2, Target, ExternalLink, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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
    color: "text-success",
    bgColor: "bg-success/10",
    badgeVariant: "default" as const,
    label: "Criação",
  },
  update: {
    icon: FileEdit,
    color: "text-warning",
    bgColor: "bg-warning/10",
    badgeVariant: "secondary" as const,
    label: "Edição",
  },
  delete: {
    icon: Trash2,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    badgeVariant: "destructive" as const,
    label: "Exclusão",
  },
};

export function ActivityFeedWidget() {
  const { user } = useAuth();

  const { data: entries, isLoading } = useQuery({
    queryKey: ["audit_log_widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-end mb-2">
        <Link to="/activity">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
            Ver tudo
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !entries?.length ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          Nenhuma atividade registrada.
        </p>
      ) : (
        <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[400px] pr-1">
          {entries.map((entry) => {
            const config = actionConfig[entry.action as keyof typeof actionConfig] || actionConfig.update;
            const Icon = entry.table_name === "monthly_targets" ? Target : config.icon;

            return (
              <div
                key={entry.id}
                className="flex items-start gap-2 p-2 rounded-md border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className={cn("mt-0.5 rounded-full p-1.5 shrink-0", config.bgColor)}>
                  <Icon className={cn("h-3 w-3", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {entry.metric_name || "Sistema"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {entry.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.user_display_name && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <User className="h-2.5 w-2.5" />
                        {entry.user_display_name}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(entry.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <Badge variant={config.badgeVariant} className="text-[9px] h-4 px-1 shrink-0">
                  {config.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
