import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  useRitualCompletions,
  useToggleRitualCompletion,
  getActiveRituals,
  getFrequencyLabel,
  getOccurrenceLabel,
  type RitualDefinition,
} from "@/hooks/useRitualCompletions";

interface RitualChecklistProps {
  metricId: string;
  year: number;
  month: number;
  canEdit: boolean;
}

const FREQ_COLORS: Record<string, string> = {
  semanal: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  quinzenal: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  mensal: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  trimestral: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
};

export function RitualChecklist({ metricId, year, month, canEdit }: RitualChecklistProps) {
  const { data: completions, isLoading } = useRitualCompletions(metricId, year, month);
  const toggle = useToggleRitualCompletion();

  const rituals = useMemo(() => getActiveRituals(metricId, month), [metricId, month]);

  const completionMap = useMemo(() => {
    const map = new Map<string, { id: string; completed: boolean }>();
    (completions || []).forEach((c) => {
      map.set(`${c.ritual_key}:${c.occurrence}`, { id: c.id, completed: c.completed });
    });
    return map;
  }, [completions]);

  const totalExpected = rituals.reduce((sum, r) => sum + r.occurrencesPerMonth, 0);
  const totalCompleted = rituals.reduce((sum, r) => {
    let count = 0;
    for (let i = 1; i <= r.occurrencesPerMonth; i++) {
      if (completionMap.get(`${r.key}:${i}`)?.completed) count++;
    }
    return sum + count;
  }, 0);
  const pct = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

  const handleToggle = (ritual: RitualDefinition, occurrence: number, currentlyCompleted: boolean) => {
    const key = `${ritual.key}:${occurrence}`;
    const existing = completionMap.get(key);
    toggle.mutate({
      metricId,
      ritualKey: ritual.key,
      year,
      month,
      occurrence,
      completed: !currentlyCompleted,
      existingId: existing?.id,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium text-muted-foreground">
          Rituais de {MONTH_NAMES[month - 1]} {year}
        </p>
        <Badge variant="outline" className={pct === 100 ? "border-success text-success" : "border-muted-foreground text-muted-foreground"}>
          {totalCompleted}/{totalExpected} ({pct}%)
        </Badge>
      </div>

      {/* Ritual groups */}
      <div className="space-y-3">
        {rituals.map((ritual) => {
          const ritualCompleted = Array.from({ length: ritual.occurrencesPerMonth }, (_, i) =>
            completionMap.get(`${ritual.key}:${i + 1}`)?.completed ?? false
          );
          const ritualDone = ritualCompleted.filter(Boolean).length;

          return (
            <div key={ritual.key} className="border border-border rounded-lg overflow-hidden">
              {/* Ritual header */}
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">{ritual.name}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${FREQ_COLORS[ritual.frequency] || ""}`}>
                    {getFrequencyLabel(ritual.frequency)}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {ritualDone}/{ritual.occurrencesPerMonth}
                </span>
              </div>

              {/* Occurrences */}
              <div className="divide-y divide-border/50">
                {Array.from({ length: ritual.occurrencesPerMonth }, (_, i) => {
                  const occ = i + 1;
                  const isCompleted = ritualCompleted[i];
                  return (
                    <label
                      key={occ}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                        isCompleted ? "bg-success/5" : "hover:bg-muted/20"
                      } ${!canEdit ? "pointer-events-none opacity-70" : ""}`}
                    >
                      <Checkbox
                        checked={isCompleted}
                        disabled={!canEdit || toggle.isPending}
                        onCheckedChange={() => handleToggle(ritual, occ, isCompleted)}
                      />
                      <span className={`text-sm ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {getOccurrenceLabel(ritual.frequency, occ)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
