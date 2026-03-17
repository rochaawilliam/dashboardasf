import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, Clock, FilePlus, FileEdit, Trash2, Target, ArrowLeft, Search, X, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link, Navigate } from "react-router-dom";

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
  metrics: "Métrica",
  profiles: "Perfil",
  user_roles: "Permissão",
  user_tab_permissions: "Permissão de Aba",
  users: "Usuário",
  training_hours: "Treinamento",
};

const PAGE_SIZE = 30;

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

export default function ActivityFeed() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["audit_log_full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    if (!loading && !user) return [];
    return entries?.filter((entry) => {
      if (actionFilter && entry.action !== actionFilter) return false;
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        (entry.metric_name?.toLowerCase().includes(term)) ||
        (entry.description?.toLowerCase().includes(term)) ||
        (entry.table_name?.toLowerCase().includes(term)) ||
        (entry.action?.toLowerCase().includes(term)) ||
        (entry.user_display_name?.toLowerCase().includes(term))
      );
    }) || [];
  }, [entries, search, actionFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filters change
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };
  const handleFilterChange = (action: string | null) => {
    setActionFilter(action);
    setPage(0);
  };

  const grouped = paginatedEntries.reduce<Record<string, AuditLogEntry[]>>((acc, entry) => {
    const dateKey = format(new Date(entry.created_at), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Feed de Atividades
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registro completo de todas as movimentações do sistema
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <Card className="mb-4">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por métrica, descrição, usuário..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-9"
                />
                {search && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                {(["create", "update", "delete"] as const).map((action) => {
                  const config = actionConfig[action];
                  return (
                    <Button
                      key={action}
                      variant={actionFilter === action ? "default" : "outline"}
                      size="sm"
                      className="h-9 text-xs gap-1"
                      onClick={() => handleFilterChange(actionFilter === action ? null : action)}
                    >
                      <config.icon className="h-3 w-3" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground">
                {filtered.length} registro{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !filtered.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {search || actionFilter ? "Nenhum resultado encontrado para os filtros aplicados." : "Nenhuma atividade registrada ainda."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {Object.entries(grouped).map(([dateKey, dayEntries]) => (
                <div key={dateKey}>
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-1.5 pt-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {format(new Date(dateKey), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {dayEntries.map((entry) => {
                      const config = actionConfig[entry.action as keyof typeof actionConfig] || actionConfig.update;
                      const Icon = entry.table_name === "monthly_targets" ? Target : config.icon;
                      const tableLabel = tableLabels[entry.table_name] || entry.table_name;
                      const changeDetail = formatChangeDetail(entry);

                      return (
                        <div
                          key={entry.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className={cn("mt-0.5 rounded-full p-2 shrink-0", config.bgColor)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium truncate">
                                {entry.metric_name || "Sistema"}
                              </p>
                              <Badge variant={config.badgeVariant} className="text-[10px] h-4 px-1.5">
                                {config.label}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                {tableLabel}
                              </Badge>
                            </div>
                            {entry.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {entry.description}
                              </p>
                            )}
                            {changeDetail && (
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
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
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {entry.user_display_name}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(entry.created_at), "HH:mm:ss", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={page === 0}
                  onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground px-3">
                  Página {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={page >= totalPages - 1}
                  onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Próxima
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
