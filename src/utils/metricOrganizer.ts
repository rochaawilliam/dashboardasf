import type { Metric, MetricCategory } from "@/hooks/useMetrics";

// Define subcategories for better organization
export interface SubcategoryConfig {
  name: string;
  keywords: string[];
  excludeKeywords?: string[];
  order: number;
}

export const subcategories: Record<MetricCategory, SubcategoryConfig[]> = {
  lucratividade: [
    { name: "Receita Total", keywords: ["Receita Total"], order: 1 },
    { name: "Assessoria", keywords: ["Assessoria"], excludeKeywords: ["Ticket Médio"], order: 2 },
    { name: "Consultoria", keywords: ["Consultoria"], excludeKeywords: ["Ticket Médio"], order: 3 },
    { name: "Pontual", keywords: ["Pontual", "Outras Receitas"], excludeKeywords: ["Ticket Médio"], order: 4 },
    { name: "Sucumbência", keywords: ["Sucumbência"], order: 5 },
    { name: "Patenteia", keywords: ["Receita Patenteia"], order: 6 },
    { name: "Receita Recorrente", keywords: ["MRR", "ARR"], order: 7 },
    { name: "Tickets Médios", keywords: ["Ticket Médio"], order: 8 },
    { name: "Indicadores de Rentabilidade", keywords: ["Lucratividade", "Margem"], order: 9 },
    { name: "Saúde Financeira", keywords: ["Inadimplência", "LTV", "Churn de Receitas", "Folha sobre", "Custo Fixo", "Cumprimento de Orçamento", "SLA Externo"], order: 10 },
    { name: "Outros Indicadores", keywords: [], order: 99 },
  ],
  execucao_comercial: [
    { name: "Alcance e Impressões", keywords: ["impressões", "alcance", "conversas iniciadas"], order: 1 },
    { name: "Geração de Leads", keywords: ["Leads"], order: 2 },
    { name: "Reuniões Agendadas", keywords: ["Reuniões agendadas"], order: 3 },
    { name: "Propostas Elaboradas", keywords: ["Propostas elaboradas"], order: 4 },
    { name: "Outros Indicadores", keywords: [], order: 99 },
  ],
  experiencia_cliente: [
    { name: "Contratos - Empresarial", keywords: ["Contratos Empresarial"], order: 1 },
    { name: "Contratos - Tributário", keywords: ["Contratos Tributário"], order: 2 },
    { name: "Contratos - Trabalhista", keywords: ["Contratos Trabalhista"], order: 3 },
    { name: "Contratos - Patenteia", keywords: ["Contratos Patenteia", "Total Contratos"], order: 4 },
    { name: "Crescimento Comercial", keywords: ["Taxa de Cumprimento de Metas", "Taxa de Conversão", "Tempo Médio de Fechamento", "Upsell", "SLA Consultivo"], order: 5 },
    { name: "Satisfação do Cliente", keywords: ["NPS", "Churn de Clientes"], order: 6 },
    { name: "Retenção e Lifetime", keywords: ["Lifetime", "Lead Time de Onboarding", "Taxa de Onboarding"], order: 7 },
    { name: "Outros Indicadores", keywords: [], order: 99 },
  ],
  produtividade: [
    { name: "Performance Jurídica", keywords: ["Lead Time Judicial", "Taxa de Sucesso", "Taxa de Cumprimento de Prazo"], order: 1 },
    { name: "Capacidade e Eficiência", keywords: ["Capacidade", "SLA Interno", "Receita por Colaborador"], order: 2 },
    { name: "Outros Indicadores", keywords: [], order: 99 },
  ],
  gestao_pessoas: [
    { name: "Engajamento", keywords: ["ENPS"], order: 1 },
    { name: "Retenção de Talentos", keywords: ["Turnover"], order: 2 },
    { name: "Outros Indicadores", keywords: [], order: 99 },
  ],
  aprendizado_crescimento: [
    { name: "Desenvolvimento", keywords: ["Treinamento", "Capacitação"], order: 1 },
    { name: "Outros Indicadores", keywords: [], order: 99 },
  ],
};

export interface GroupedSubcategory {
  name: string;
  metrics: Metric[];
  order: number;
}

export function organizeMetricsBySubcategory(
  metrics: Metric[],
  category: MetricCategory
): GroupedSubcategory[] {
  const categorySubcats = subcategories[category] || [];
  const result: Map<string, GroupedSubcategory> = new Map();
  const usedMetricIds = new Set<string>();

  // Initialize subcategories
  categorySubcats.forEach((subcat) => {
    result.set(subcat.name, {
      name: subcat.name,
      metrics: [],
      order: subcat.order,
    });
  });

  // Assign metrics to subcategories based on keywords
  metrics.forEach((metric) => {
    let assigned = false;
    
    for (const subcat of categorySubcats) {
      if (subcat.keywords.length === 0) continue; // Skip "Outros" for now
      
      const matchesKeyword = subcat.keywords.some((keyword) =>
        metric.name.toLowerCase().includes(keyword.toLowerCase())
      );
      const matchesExclude = subcat.excludeKeywords?.some((keyword) =>
        metric.name.toLowerCase().includes(keyword.toLowerCase())
      ) || false;
      
      if (matchesKeyword && !matchesExclude && !usedMetricIds.has(metric.id)) {
        result.get(subcat.name)?.metrics.push(metric);
        usedMetricIds.add(metric.id);
        assigned = true;
        break;
      }
    }
    
    // If not assigned, put in "Outros Indicadores"
    if (!assigned && !usedMetricIds.has(metric.id)) {
      const outros = result.get("Outros Indicadores");
      if (outros) {
        outros.metrics.push(metric);
        usedMetricIds.add(metric.id);
      }
    }
  });

  // Sort metrics within each subcategory by name
  result.forEach((subcat) => {
    subcat.metrics.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  });

  // Convert to array and sort by order, filter empty subcategories
  return Array.from(result.values())
    .filter((subcat) => subcat.metrics.length > 0)
    .sort((a, b) => a.order - b.order);
}
