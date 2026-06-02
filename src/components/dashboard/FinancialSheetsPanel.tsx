import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, RefreshCw, Save, Trash2, CheckCircle2 } from "lucide-react";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface SheetSource {
  id?: string;
  year: number;
  month: number;
  csv_url: string;
  last_synced_at: string | null;
}

export function FinancialSheetsPanel() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [pendingMonth, setPendingMonth] = useState<number | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const { data: sources, isLoading } = useQuery({
    queryKey: ["financial_sheet_sources", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_sheet_sources" as any)
        .select("id,year,month,csv_url,last_synced_at")
        .eq("year", year)
        .order("month");
      if (error) throw error;
      return (data as unknown as SheetSource[]) ?? [];
    },
  });

  const sourceFor = (m: number) => sources?.find((s) => s.month === m);

  const handleSave = async (m: number) => {
    const url = (drafts[m] ?? sourceFor(m)?.csv_url ?? "").trim();
    if (!url) {
      toast.error("Cole a URL CSV publicada da aba do mês");
      return;
    }
    if (!/^https?:\/\//.test(url)) {
      toast.error("URL inválida");
      return;
    }
    setPendingMonth(m);
    try {
      const { error } = await supabase
        .from("financial_sheet_sources" as any)
        .upsert(
          { year, month: m, csv_url: url },
          { onConflict: "year,month" }
        );
      if (error) throw error;
      toast.success(`${MONTH_NAMES[m - 1]}/${year} salvo`);
      setDrafts((d) => {
        const n = { ...d };
        delete n[m];
        return n;
      });
      await qc.invalidateQueries({ queryKey: ["financial_sheet_sources"] });
      await qc.invalidateQueries({ queryKey: ["financial-cashflow"] });
    } catch (e: any) {
      toast.error(`Falha ao salvar: ${e?.message ?? "erro desconhecido"}`);
    } finally {
      setPendingMonth(null);
    }
  };

  const handleDelete = async (m: number) => {
    const src = sourceFor(m);
    if (!src) return;
    setPendingMonth(m);
    try {
      const { error } = await supabase
        .from("financial_sheet_sources" as any)
        .delete()
        .eq("year", year)
        .eq("month", m);
      if (error) throw error;
      toast.success(`${MONTH_NAMES[m - 1]}/${year} removido`);
      await qc.invalidateQueries({ queryKey: ["financial_sheet_sources"] });
      await qc.invalidateQueries({ queryKey: ["financial-cashflow"] });
    } catch (e: any) {
      toast.error(`Falha: ${e?.message ?? "erro desconhecido"}`);
    } finally {
      setPendingMonth(null);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/sync-financial-cashflow?year=${year}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const errorCount = Object.keys(data?.errors ?? {}).length;
      const okCount = Object.keys(data?.months ?? {}).length;
      if (errorCount > 0) {
        toast.warning(`${okCount} ok, ${errorCount} com erro. Verifique as URLs.`);
      } else {
        toast.success(`${okCount} meses sincronizados`);
      }
      await qc.invalidateQueries({ queryKey: ["financial_sheet_sources"] });
      await qc.invalidateQueries({ queryKey: ["financial-cashflow"] });
    } catch (e: any) {
      toast.error(`Sync falhou: ${e?.message ?? "erro"}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Planilhas Financeiras (Fluxo de Caixa)
        </CardTitle>
        <CardDescription>
          Cole a URL CSV publicada da aba de cada mês. Os cards do Financeiro (Receita Total,
          Lucratividade, Folha sobre Receita e Custo Fixo sobre Receita) passam a vir direto da planilha. Para publicar:
          no Google Sheets vá em <strong>Arquivo → Compartilhar → Publicar na web</strong>,
          selecione a aba do mês e o formato <strong>CSV</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
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
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncAll}
            disabled={isSyncingAll || !sources?.length}
          >
            {isSyncingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar todos
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const src = sourceFor(m);
              const draft = drafts[m];
              const value = draft !== undefined ? draft : src?.csv_url ?? "";
              const isDirty = draft !== undefined && draft !== (src?.csv_url ?? "");
              const isPending = pendingMonth === m;
              return (
                <div
                  key={m}
                  className="flex items-center gap-2 p-2 border rounded-md bg-card"
                >
                  <div className="w-24 shrink-0 text-sm font-medium">
                    {MONTH_NAMES[m - 1]}
                  </div>
                  <Input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=XXX&single=true&output=csv"
                    value={value}
                    onChange={(e) => setDrafts((d) => ({ ...d, [m]: e.target.value }))}
                    className="flex-1 h-8 text-xs"
                  />
                  {src?.last_synced_at && !isDirty && (
                    <span
                      className="text-[10px] text-muted-foreground hidden md:flex items-center gap-1 shrink-0"
                      title={new Date(src.last_synced_at).toLocaleString("pt-BR")}
                    >
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      {new Date(src.last_synced_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant={isDirty ? "default" : "outline"}
                    disabled={isPending || !value.trim()}
                    onClick={() => handleSave(m)}
                    className="h-8"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-3 w-3 mr-1" />
                        Salvar
                      </>
                    )}
                  </Button>
                  {src && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleDelete(m)}
                      className="h-8"
                      title="Remover"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
