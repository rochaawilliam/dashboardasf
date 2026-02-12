import { useEffect, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { Metric, MetricHistory } from "@/hooks/useMetrics";
import { parseLocalDate } from "@/utils/dateUtils";
import { formatMetricValue } from "@/utils/formatters";
import { areNotificationsEnabled } from "@/components/dashboard/NotificationToggle";

interface MetricStatus {
  metricId: string;
  achievedGoal: boolean;
}

// Metrics where lower is better
const inverseMetrics = ["Churn de Clientes", "Turnover"];

// Non-accumulative metrics (averages, rates, percentages)
const nonAccumulativeKeywords = [
  "Ticket Médio",
  "Margem",
  "Churn",
  "Custo Fixo",
  "Folha sobre Receita",
  "Inadimplência",
  "Cumprimento do Orçamento",
  "Lead Time",
  "SLA",
  "NPS",
  "ENPS",
  "Taxa",
  "Turnover",
  "LTV",
  "Upsell",
];

function isNonAccumulativeMetric(name: string, unit: string): boolean {
  if (unit === "%" || unit.toLowerCase().includes("percent")) {
    return true;
  }
  return nonAccumulativeKeywords.some(keyword => 
    name.toLowerCase().includes(keyword.toLowerCase())
  );
}

function checkGoalAchieved(
  metric: Metric,
  accumulatedValue: number
): boolean {
  const isInverse = inverseMetrics.includes(metric.name);
  const isNonAccumulative = isNonAccumulativeMetric(metric.name, metric.unit);
  
  const target = isNonAccumulative ? metric.target_value : metric.target_value;
  
  if (isInverse) {
    return accumulatedValue <= target;
  }
  return accumulatedValue >= target;
}

export function useMetricNotifications(
  metrics: Metric[] | undefined,
  historyData: MetricHistory[] | undefined,
  selectedYear: number
) {
  const previousStatusRef = useRef<MetricStatus[]>([]);
  const isInitializedRef = useRef(false);

  const calculateAccumulatedValues = useCallback((
    metrics: Metric[],
    history: MetricHistory[]
  ): Record<string, number> => {
    const values: Record<string, number> = {};
    history.forEach((h) => {
      const date = parseLocalDate(h.recorded_at);
      if (date.getFullYear() === selectedYear) {
        values[h.metric_id] = (values[h.metric_id] || 0) + h.value;
      }
    });
    return values;
  }, [selectedYear]);

  useEffect(() => {
    if (!metrics || !historyData) return;

    const accumulatedValues = calculateAccumulatedValues(metrics, historyData);
    
    const currentStatuses: MetricStatus[] = metrics.map(metric => ({
      metricId: metric.id,
      achievedGoal: checkGoalAchieved(metric, accumulatedValues[metric.id] || 0),
    }));

    // Skip notifications on initial load
    if (!isInitializedRef.current) {
      previousStatusRef.current = currentStatuses;
      isInitializedRef.current = true;
      return;
    }

    // Check for status changes
    currentStatuses.forEach(current => {
      const previous = previousStatusRef.current.find(p => p.metricId === current.metricId);
      const metric = metrics.find(m => m.id === current.metricId);
      
      if (!previous || !metric) return;

      const accumulated = accumulatedValues[current.metricId] || 0;
      const notificationsEnabled = areNotificationsEnabled();

      // Goal was achieved!
      if (!previous.achievedGoal && current.achievedGoal) {
        // Always show toast
        toast({
          title: "🎉 Meta Atingida!",
          description: `"${metric.name}" atingiu a meta! Atual: ${formatMetricValue(accumulated, metric.unit, metric.name)} | Meta: ${formatMetricValue(metric.target_value, metric.unit, metric.name)}`,
          duration: 8000,
        });

        // Browser notification only if enabled
        if (notificationsEnabled) {
          new Notification("🎉 Meta Atingida!", {
            body: `"${metric.name}" atingiu a meta anual!`,
            icon: "/favicon.ico",
            tag: `goal-achieved-${metric.id}`,
          });
        }
      }

      // Goal was lost
      if (previous.achievedGoal && !current.achievedGoal) {
        // Always show toast
        toast({
          title: "⚠️ Meta Perdida",
          description: `"${metric.name}" está abaixo da meta. Atual: ${formatMetricValue(accumulated, metric.unit, metric.name)} | Meta: ${formatMetricValue(metric.target_value, metric.unit, metric.name)}`,
          variant: "destructive",
          duration: 8000,
        });

        // Browser notification only if enabled
        if (notificationsEnabled) {
          new Notification("⚠️ Meta Perdida", {
            body: `"${metric.name}" caiu abaixo da meta anual.`,
            icon: "/favicon.ico",
            tag: `goal-lost-${metric.id}`,
          });
        }
      }
    });

    previousStatusRef.current = currentStatuses;
  }, [metrics, historyData, calculateAccumulatedValues]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // Delay the request to avoid blocking initial load
      const timer = setTimeout(() => {
        Notification.requestPermission();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}

// Utility to manually request notification permission
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return Promise.resolve("denied" as NotificationPermission);
  }
  return Notification.requestPermission();
}

// Utility to check notification permission status
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}
