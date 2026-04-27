import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metric } from "@/types/metric";

type SourceInfo = {
  source: "Operacional" | "Dashboard";
  filter: "created_at" | "month";
  formula?: string;
  calculation?: string;
};

interface AuditPanelProps {
  metrics: Metric[];
  sourceInfo: Record<string, SourceInfo>;
  selectedMonthName?: string;
  selectedYear: number;
}

export function AuditPanel({ metrics, sourceInfo, selectedMonthName, selectedYear }: AuditPanelProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "Operacional" | "Dashboard">("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return metrics
      .filter((m) => sourceInfo[m.id])
      .map((m) => ({ metric: m, info: sourceInfo[m.id] }))
      .filter(({ metric, info }) => {
        if (filter !== "all" && info.source !== filter) return false;
        if (!q) return true;
        return (
          metric.name.toLowerCase().includes(q) ||
          (info.formula ?? "").toLowerCase().includes(q) ||
          (info.calculation ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.metric.name.localeCompare(b.metric.name, "pt-BR"));
  }, [metrics, sourceInfo, query, filter]);

  const counts = useMemo(() => {
    const all = Object.values(sourceInfo);
    return {
      total: all.length,
      op: all.filter((i) => i.source === "Operacional").length,
      db: all.filter((i) => i.source === "Dashboard").length,
    };
  }, [sourceInfo]);

  const exportCSV = () => {
    const header = ["Métrica", "Origem", "Filtro", "Fórmula", "Cálculo"];
    const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = [header.join(",")];
    for (const { metric, info } of rows) {
      lines.push(
        [metric.name, info.source, info.filter, info.formula ?? "", info.calculation ?? ""]
          .map(escape)
          .join(",")
      );
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-metricas-${selectedYear}-${selectedMonthName ?? "anual"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" aria-label="Abrir modo auditoria">
          <ClipboardList className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Auditoria</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-0">
        <div className="sticky top-0 bg-background z-10 border-b border-border/50 p-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Modo Auditoria — Origem dos Indicadores
            </SheetTitle>
            <SheetDescription>
              Período: <span className="font-medium text-foreground">{selectedMonthName ?? "Acumulado"} {selectedYear}</span>
              {" · "}{counts.total} métricas rastreadas ({counts.op} Operacional · {counts.db} Dashboard)
            </SheetDescription>
          </SheetHeader>

          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar métrica, fórmula..."
                className="pl-7 h-8 text-xs"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "Operacional", "Dashboard"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "Todas" : f}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma métrica corresponde aos filtros.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-muted/50">
                  <tr className="text-left">
                    <th className="p-2 font-semibold border-b border-border/50">Métrica</th>
                    <th className="p-2 font-semibold border-b border-border/50">Origem</th>
                    <th className="p-2 font-semibold border-b border-border/50">Filtro</th>
                    <th className="p-2 font-semibold border-b border-border/50">Fórmula</th>
                    <th className="p-2 font-semibold border-b border-border/50">Cálculo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ metric, info }) => (
                    <tr key={metric.id} className="border-b border-border/30 hover:bg-muted/30 align-top">
                      <td className="p-2 font-medium">{metric.name}</td>
                      <td className="p-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold",
                            info.source === "Operacional"
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {info.source}
                        </Badge>
                      </td>
                      <td className="p-2 font-mono text-[11px] text-muted-foreground">{info.filter}</td>
                      <td className="p-2 font-mono text-[11px] text-foreground/90">{info.formula ?? "—"}</td>
                      <td className="p-2 text-foreground/80">{info.calculation ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
