/**
 * Brazilian number formatting utilities
 */

/**
 * Format a number in Brazilian locale (1.234,56)
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as Brazilian currency (R$ 1.234,56)
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as percentage (12,34%)
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Format a metric value with its unit in Brazilian format
 */
export function formatMetricValue(value: number, unit: string, metricName?: string): string {
  // Check if this is a financial metric (uses decimals)
  const isFinancial = unit === "R$" || 
                      unit.toLowerCase().includes("real") || 
                      unit.toLowerCase().includes("reais");
  
  // Default: no decimals unless financial
  let decimals = isFinancial ? 2 : 0;
  
  // Always show 2 decimals for financial values

  
  // Currency units
  if (isFinancial) {
    return formatCurrency(value, decimals);
  }
  
  // Percentage units - no decimals
  if (unit === "%" || unit.toLowerCase().includes("percent")) {
    return formatPercent(value, 0);
  }
  
  // Points/Score units - no decimals
  if (unit.toLowerCase().includes("pts") || unit.toLowerCase().includes("ponto")) {
    return `${formatNumber(value, 0)} pts`;
  }
  
  // Days units
  if (unit.toLowerCase().includes("dia") || unit.toLowerCase() === "dias") {
    return `${formatNumber(value, 0)} dias`;
  }
  
  // Hours units
  if (unit.toLowerCase().includes("hora") || unit.toLowerCase() === "h") {
    return `${formatNumber(value, 0)}h`;
  }
  
  // Months units
  if (unit.toLowerCase().includes("mes") || unit.toLowerCase().includes("mês") || unit.toLowerCase().includes("meses")) {
    return `${formatNumber(value, 0)} meses`;
  }

  // People units
  if (unit.toLowerCase() === "pessoas") {
    return `${formatNumber(value, 0)} pessoas`;
  }

  // Modules units
  if (unit.toLowerCase() === "módulos") {
    return `${formatNumber(value, 0)} módulos`;
  }
  
  // "número", "contratos", or "un" - just show the number, no unit label
  if (unit.toLowerCase() === "número" || unit.toLowerCase() === "contratos" || unit.toLowerCase() === "un") {
    return formatNumber(value, 0);
  }
  
  // Generic number with unit - no decimals
  return `${formatNumber(value, 0)}${unit ? ` ${unit}` : ""}`;
}

/**
 * Format a compact number (1.2M, 500K, etc.) in Brazilian format
 */
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${formatNumber(value / 1_000_000, 1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${formatNumber(value / 1_000, 1)}K`;
  }
  return formatNumber(value, 0);
}
