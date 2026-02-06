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
export function formatMetricValue(value: number, unit: string): string {
  // Determine decimal places based on value magnitude
  const decimals = Math.abs(value) >= 1000 ? 0 : 2;
  
  // Currency units
  if (unit === "R$" || unit.toLowerCase().includes("real") || unit.toLowerCase().includes("reais")) {
    return formatCurrency(value, decimals);
  }
  
  // Percentage units
  if (unit === "%" || unit.toLowerCase().includes("percent")) {
    return formatPercent(value, decimals);
  }
  
  // Points/Score units
  if (unit.toLowerCase().includes("pts") || unit.toLowerCase().includes("ponto")) {
    return `${formatNumber(value, decimals)} pts`;
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
  
  // Generic number with unit
  return `${formatNumber(value, decimals)}${unit ? ` ${unit}` : ""}`;
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
