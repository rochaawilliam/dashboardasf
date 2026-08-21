import { useQuery } from "@tanstack/react-query";

export interface TrafficMonthData {
  valor_investido: number;
  impressoes: number;
  alcance: number;
  cliques_saida: number;
  conversas_iniciadas: number;
  custo_por_conversa: number;
  meta_valor_investido?: number;
  meta_conversas_iniciadas?: number;
  google_valor_investido?: number;
  google_impressoes?: number;
  google_cliques?: number;
  google_conversoes?: number;
}

export interface TrafficFunnelData {
  months: Record<string, TrafficMonthData>;
  totals: TrafficMonthData;
  year: number;
}

const CACHE_KEY = "traffic-funnel-cache";
const CACHE_TTL = 10 * 60 * 1000;

function getCached(year: number): TrafficFunnelData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp, cacheYear } = JSON.parse(raw);
    if (cacheYear !== year) return null;
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data as TrafficFunnelData;
  } catch {
    return null;
  }
}

function setCache(year: number, data: TrafficFunnelData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now(), cacheYear: year }));
  } catch {}
}

export function useTrafficFunnelData(year: number) {
  return useQuery({
    queryKey: ["traffic-funnel", year],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/sync-traffic-funnel?year=${year}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) throw new Error(`Traffic funnel fetch failed: ${res.status}`);
      const data = (await res.json()) as TrafficFunnelData;
      setCache(year, data);
      return data;
    },
    placeholderData: () => getCached(year) ?? undefined,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    retry: 2,
  });
}
