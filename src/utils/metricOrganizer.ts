import type { Metric, MetricCategory } from "@/hooks/useMetrics";
import type { Subcategory, SubcategoryAssignment } from "@/hooks/useSubcategories";

export interface GroupedSubcategory {
  id: string;
  name: string;
  metrics: Metric[];
  order: number;
}

/**
 * Organize metrics by DB-stored subcategories and assignments.
 * Metrics without assignment go to "Outros Indicadores" if it exists, 
 * otherwise they are grouped at the end.
 */
export function organizeMetricsBySubcategory(
  metrics: Metric[],
  category: MetricCategory,
  subcategories?: Subcategory[],
  assignments?: SubcategoryAssignment[]
): GroupedSubcategory[] {
  // If no DB data, return single group with all metrics
  if (!subcategories || !assignments || subcategories.length === 0) {
    return metrics.length > 0
      ? [{ id: "all", name: "Todos", metrics: [...metrics], order: 0 }]
      : [];
  }

  const categorySubcats = subcategories
    .filter((s) => s.category === category)
    .sort((a, b) => a.sort_order - b.sort_order);

  const result: Map<string, GroupedSubcategory> = new Map();
  const assignedMetricIds = new Set<string>();

  // Initialize subcategories
  categorySubcats.forEach((subcat) => {
    result.set(subcat.id, {
      id: subcat.id,
      name: subcat.name,
      metrics: [],
      order: subcat.sort_order,
    });
  });

  // Get assignments for metrics in this category
  const metricIds = new Set(metrics.map((m) => m.id));
  const relevantAssignments = assignments
    .filter((a) => metricIds.has(a.metric_id))
    .sort((a, b) => a.sort_order - b.sort_order);

  // Assign metrics based on DB assignments
  relevantAssignments.forEach((assignment) => {
    const subcatGroup = result.get(assignment.subcategory_id);
    if (subcatGroup) {
      const metric = metrics.find((m) => m.id === assignment.metric_id);
      if (metric) {
        subcatGroup.metrics.push(metric);
        assignedMetricIds.add(metric.id);
      }
    }
  });

  // Put unassigned metrics in "Outros Indicadores" or create catch-all
  const unassigned = metrics.filter((m) => !assignedMetricIds.has(m.id));
  if (unassigned.length > 0) {
    const outrosSubcat = categorySubcats.find((s) => s.name === "Outros Indicadores");
    if (outrosSubcat) {
      const outrosGroup = result.get(outrosSubcat.id);
      if (outrosGroup) {
        outrosGroup.metrics.push(...unassigned);
      }
    } else {
      result.set("unassigned", {
        id: "unassigned",
        name: "Outros Indicadores",
        metrics: unassigned,
        order: 999,
      });
    }
  }

  // Convert to array, filter empty, sort by order
  return Array.from(result.values())
    .filter((subcat) => subcat.metrics.length > 0)
    .sort((a, b) => a.order - b.order);
}
