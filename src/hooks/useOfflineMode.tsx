import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metric, MetricHistory, TrainingHours } from "@/hooks/useMetrics";

const CACHE_KEYS = {
  metrics: "offline-cache-metrics",
  history: "offline-cache-history",
  training: "offline-cache-training",
  pendingMutations: "offline-pending-mutations",
  lastSync: "offline-last-sync",
};

interface PendingMutation {
  id: string;
  type: "metric_history";
  action: "insert" | "update";
  data: any;
  timestamp: number;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast({
          title: "🌐 Conexão restaurada",
          description: "Sincronizando dados pendentes...",
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast({
        title: "📴 Modo offline",
        description: "Os dados serão salvos localmente.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  return isOnline;
}

export function useOfflineCache() {
  const saveToCache = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error("Failed to save to cache:", error);
    }
  }, []);

  const getFromCache = useCallback(<T,>(key: string): T | null => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data as T;
        }
      }
    } catch (error) {
      console.error("Failed to read from cache:", error);
    }
    return null;
  }, []);

  const clearCache = useCallback(() => {
    Object.values(CACHE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }, []);

  // Cache metrics data
  const cacheMetrics = useCallback((metrics: Metric[]) => {
    saveToCache(CACHE_KEYS.metrics, metrics);
  }, [saveToCache]);

  const getCachedMetrics = useCallback((): Metric[] | null => {
    return getFromCache<Metric[]>(CACHE_KEYS.metrics);
  }, [getFromCache]);

  // Cache history data
  const cacheHistory = useCallback((history: MetricHistory[]) => {
    saveToCache(CACHE_KEYS.history, history);
  }, [saveToCache]);

  const getCachedHistory = useCallback((): MetricHistory[] | null => {
    return getFromCache<MetricHistory[]>(CACHE_KEYS.history);
  }, [getFromCache]);

  // Cache training hours
  const cacheTraining = useCallback((training: TrainingHours[]) => {
    saveToCache(CACHE_KEYS.training, training);
  }, [saveToCache]);

  const getCachedTraining = useCallback((): TrainingHours[] | null => {
    return getFromCache<TrainingHours[]>(CACHE_KEYS.training);
  }, [getFromCache]);

  return {
    cacheMetrics,
    getCachedMetrics,
    cacheHistory,
    getCachedHistory,
    cacheTraining,
    getCachedTraining,
    clearCache,
  };
}

export function usePendingMutations() {
  const [pendingCount, setPendingCount] = useState(0);

  const loadPending = useCallback((): PendingMutation[] => {
    try {
      const pending = localStorage.getItem(CACHE_KEYS.pendingMutations);
      return pending ? JSON.parse(pending) : [];
    } catch {
      return [];
    }
  }, []);

  const savePending = useCallback((mutations: PendingMutation[]) => {
    localStorage.setItem(CACHE_KEYS.pendingMutations, JSON.stringify(mutations));
    setPendingCount(mutations.length);
  }, []);

  const addPendingMutation = useCallback((mutation: Omit<PendingMutation, "id" | "timestamp">) => {
    const pending = loadPending();
    const newMutation: PendingMutation = {
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    pending.push(newMutation);
    savePending(pending);
    return newMutation;
  }, [loadPending, savePending]);

  const removePendingMutation = useCallback((id: string) => {
    const pending = loadPending();
    const filtered = pending.filter((m) => m.id !== id);
    savePending(filtered);
  }, [loadPending, savePending]);

  const getPendingMutations = useCallback(() => {
    return loadPending();
  }, [loadPending]);

  const clearPendingMutations = useCallback(() => {
    savePending([]);
  }, [savePending]);

  useEffect(() => {
    setPendingCount(loadPending().length);
  }, [loadPending]);

  return {
    pendingCount,
    addPendingMutation,
    removePendingMutation,
    getPendingMutations,
    clearPendingMutations,
  };
}

interface OfflineIndicatorProps {
  pendingCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function OfflineIndicator({ pendingCount = 0, onSync, isSyncing }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50",
        "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border",
        isOnline
          ? "bg-warning/10 border-warning/30 text-warning"
          : "bg-destructive/10 border-destructive/30 text-destructive"
      )}
    >
      {isOnline ? (
        <Wifi className="h-4 w-4 flex-shrink-0" />
      ) : (
        <WifiOff className="h-4 w-4 flex-shrink-0" />
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {isOnline ? "Dados pendentes" : "Modo offline"}
        </p>
        <p className="text-xs opacity-80">
          {isOnline
            ? pendingCount + " alteração(ões) aguardando sincronização"
            : "Os dados serão salvos localmente"}
        </p>
      </div>

      {isOnline && pendingCount > 0 && onSync && (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
            "bg-warning text-warning-foreground hover:bg-warning/90 transition-colors",
            isSyncing && "opacity-50 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
          {isSyncing ? "Sincronizando..." : "Sincronizar"}
        </button>
      )}
    </div>
  );
}

export function useLastSync() {
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(CACHE_KEYS.lastSync);
    if (saved) {
      const date = new Date(parseInt(saved));
      setLastSync(
        date.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  }, []);

  const updateLastSync = useCallback(() => {
    localStorage.setItem(CACHE_KEYS.lastSync, Date.now().toString());
    setLastSync(
      new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, []);

  return { lastSync, updateLastSync };
}