import { forwardRef } from "react";
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslationSafe } from "@/hooks/useTranslation";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface SyncStatusFooterProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onSync: () => void;
  lastSyncedAt?: Date | null;
}

export const SyncStatusFooter = forwardRef<HTMLElement, SyncStatusFooterProps>(
  function SyncStatusFooter({ 
    isOnline, 
    pendingCount, 
    isSyncing, 
    onSync,
    lastSyncedAt 
  }, ref) {
    const { t } = useTranslationSafe();
    const { lastSyncedAt: prefsLastSync, isLoggedIn } = useUserPreferences();
    
    // Use the most recent sync time
    const displaySyncTime = lastSyncedAt || prefsLastSync;
    
    const formatSyncTime = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      
      if (minutes < 1) return "agora";
      if (minutes < 60) return `${minutes}min atrás`;
      if (hours < 24) return `${hours}h atrás`;
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    return (
      <footer ref={ref} className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border/50 py-2 px-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left side - Connection status */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
              isOnline 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span className="hidden sm:inline">{t.offline.online}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span className="hidden sm:inline">{t.offline.indicator}</span>
                </>
              )}
            </div>
            
            {/* Pending changes indicator */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
                <Cloud className="h-3 w-3" />
                <span>{pendingCount} {t.offline.pendingChanges}</span>
              </div>
            )}
          </div>
          
          {/* Center - Last sync time + ASF link */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {displaySyncTime ? (
              <>
                <CloudOff className="h-3 w-3 hidden sm:block" />
                <span className="hidden sm:inline">{t.offline.lastSync}:</span>
                <span className="font-medium">{formatSyncTime(displaySyncTime)}</span>
              </>
            ) : (
              <span className="text-muted-foreground/70">
                {isLoggedIn ? "Sincronizando..." : "Modo local"}
              </span>
            )}
            <span className="hidden sm:inline text-border">|</span>
            <a 
              href="https://www.asfnegocios.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:inline text-primary hover:underline"
            >
              www.asfnegocios.com.br
            </a>
          </div>
          
          {/* Right side - Version info + Sync button */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[10px] text-muted-foreground/60">
              Versão 1.0 | Desenvolvido por William Rocha
            </span>
            {(pendingCount > 0 || !isOnline) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                disabled={isSyncing || !isOnline}
                className="h-7 px-2 sm:px-3 text-xs gap-1.5"
              >
                <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                <span className="hidden sm:inline">
                  {isSyncing ? t.offline.syncing : t.offline.sync}
                </span>
              </Button>
            )}
          </div>
        </div>
      </footer>
    );
  }
);
