import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Lock, LockOpen, CalendarCheck, RefreshCw } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  pipeline: "Pipeline (Crescimento + Comissão)",
  traffic_funnel: "Tráfego (Funil Online)",
  financial_cashflow: "Financeiro (Fluxo de Caixa)",
};

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface Snapshot {
  id: string;
  source: string;
  year: number;
  month: number;
  closed_at: string;
  auto_closed: boolean;
}

export function MonthClosurePanel() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ["month_snapshots", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("month_snapshots" as any)
        .select("id,source,year,month,closed_at,auto_closed")
        .eq("year", year)
        .order("month", { ascending: true });
      if (error) throw error;
      return (data as unknown as Snapshot[]) ?? [];
    },
  });

  const isClosed = (source: string, m: number) =>
    snapshots?.some((s) => s.source === source && s.month === m);

  const snapshotFor = (source: string, m: number) =>
    snapshots?.find((s) => s.source === source && s.month === m);

  const callCloseMonth = async (action: "close" | "reopen", source: string, m: number) => {
    const key = `${source}-${m}-${action}`;
    setPendingKey(key);
    try {
      const { data, error } = await supabase.functions.invoke("close-month", {
        body: { action, year, month: m, sources: [source] },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(
        action === "close"
          ? `${MONTH_NAMES[m - 1]}/${year} fechado para ${SOURCE_LABELS[source]}`
          : `${MONTH_NAMES[m - 1]}/${year} reaberto para ${SOURCE_LABELS[source]}`
      );
      await qc.invalidateQueries({ queryKey: ["month_snapshots"] });
      await qc.invalidateQueries({ queryKey: ["pipeline-data"] });
      await qc.invalidateQueries({ queryKey: ["traffic-funnel"] });
      await qc.invalidateQueries({ queryKey: ["financial-cashflow"] });
    } catch (e: any) {
      toast.error(`Falha: ${e?.message ?? "erro desconhecido"}`);
    } finally {
      setPendingKey(null);
    }
  };

  const years = [currentYear - 1, currentYear, currentYear + 1];
  const sources = Object.keys(SOURCE_LABELS);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Fechamento de Meses
        </CardTitle>
        <CardDescription>
          Ao fechar um mês, os dados ficam congelados como estavam naquele momento. Sincronizações
          futuras do Pipeline ou das planilhas não alteram mais o mês fechado. O sistema também
          fecha automaticamente o mês anterior no dia 1º.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Ano:</span>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {sources.map((source) => (
              <div key={source} className="space-y-2">
                <h4 className="text-sm font-semibold">{SOURCE_LABELS[source]}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const closed = isClosed(source, m);
                    const snap = snapshotFor(source, m);
                    const action = closed ? "reopen" : "close";
                    const key = `${source}-${m}-${action}`;
                    const isPending = pendingKey === key;
                    return (
                      <div
                        key={m}
                        className={`border rounded-md p-2 flex flex-col gap-1 ${
                          closed ? "bg-muted/40 border-primary/30" : "bg-background"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {MONTH_NAMES[m - 1]}/{year}
                          </span>
                          {closed ? (
                            <Badge variant="secondary" className="gap-1 text-[10px] py-0">
                              <CalendarCheck className="h-3 w-3" />
                              {snap?.auto_closed ? "Auto" : "Fechado"}
                            </Badge>
                          ) : null}
                        </div>
                        {closed ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => callCloseMonth("reopen", source, m)}
                            className="h-7 text-xs"
                          >
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <LockOpen className="h-3 w-3 mr-1" />
                                Reabrir
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            disabled={isPending}
                            onClick={() => callCloseMonth("close", source, m)}
                            className="h-7 text-xs"
                          >
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                Fechar
                              </>
                            )}
                          </Button>
                        )}
                        {closed && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => callCloseMonth("close", source, m)}
                            className="h-6 text-[10px] text-muted-foreground"
                            title="Refazer snapshot com os dados atuais"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Atualizar
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
