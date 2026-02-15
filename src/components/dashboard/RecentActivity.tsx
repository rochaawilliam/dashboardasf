import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentActivity() {
  const { user } = useAuth();

  const { data: recentEntries, isLoading } = useQuery({
    queryKey: ["recent_activity", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metric_history")
        .select("*, metrics(name, unit, category)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Atividade Recente
        </CardTitle>
        <CardDescription>Últimos lançamentos registrados no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !recentEntries?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum lançamento encontrado.
          </p>
        ) : (
          <div className="space-y-3">
            {recentEntries.map((entry) => {
              const metric = entry.metrics as any;
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/30"
                >
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {metric?.name || "Métrica"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Valor: <span className="font-semibold text-foreground">{entry.value}</span>
                      {metric?.unit ? ` ${metric.unit}` : ""}
                      {entry.comment && (
                        <span className="ml-2 italic">— {entry.comment}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(entry.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
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
