import { useQuery } from "@tanstack/react-query";

export interface MarketingSheetData {
  months: Record<string, Record<string, number>>;
  accumulated: Record<string, number>;
  definitions: Record<string, { unit: string; target: string }>;
  synced_at: string;
}

const CACHE_KEY = "marketing-sheet-cache";
const CACHE_TTL = 10 * 60 * 1000;

function getCached(): MarketingSheetData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data as MarketingSheetData;
  } catch {
    return null;
  }
}

export function useMarketingSheetData() {
  return useQuery({
    queryKey: ["marketing-sheet"],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/sync-marketing-sheet`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) throw new Error(`Marketing sheet fetch failed: ${res.status}`);
      const data = (await res.json()) as MarketingSheetData;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {}
      return data;
    },
    placeholderData: () => getCached() ?? undefined,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    retry: 2,
  });
}
