import { Shield, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { TourButton } from "./GuidedTour";
import { UserSettingsPanel } from "./UserSettingsPanel";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import asfLogo from "@/assets/asf-logo.png";
import type { Metric, MetricHistory } from "@/hooks/useMetrics";
import { ReactNode } from "react";

interface DashboardHeaderProps {
  metrics?: Metric[];
  historyData?: MetricHistory[];
  selectedYear?: number;
  mobileDrawer?: ReactNode;
}

export function DashboardHeader({ 
  metrics, 
  historyData, 
  selectedYear = new Date().getFullYear(),
  mobileDrawer 
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();

  return (
    <header className="mb-2 sm:mb-4 pb-2 sm:pb-4 border-b border-border/30">
      {/* Row 1: Logo + Title */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {mobileDrawer}
        
        <img 
          src={asfLogo} 
          alt="ASF - Amaral & Souza Freitas - Advocacia de Negócios" 
          className="h-7 sm:h-10 md:h-11 w-auto"
        />
        <div className="h-6 sm:h-8 w-px bg-border/50 hidden sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-foreground tracking-wide truncate">
            Dashboard de Metas
          </h1>
          <p className="text-muted-foreground text-[8px] sm:text-[11px] uppercase tracking-wider mt-0.5 truncate hidden sm:block">
            Setor de Crescimento • Comercial & Marketing
          </p>
        </div>
        
        {/* Desktop: actions inline */}
        {!isMobile && (
          <div className="flex items-center gap-1 sm:gap-2">
            {user && (
              <>
                <div data-tour="notifications">
                  {metrics && (
                    <NotificationBell 
                      metrics={metrics} 
                      historyData={historyData}
                      selectedYear={selectedYear}
                    />
                  )}
                </div>
                <TourButton />
                <UserSettingsPanel />
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" className="h-9 w-9 border border-border/50" title="Painel Administrativo">
                      <Shield className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </>
            )}
            {user ? (
              <UserMenu />
            ) : (
              <Link to="/login">
                <Button variant="default" className="h-9 px-3 gap-1" title="Entrar">
                  <LogIn className="h-4 w-4" />
                  <span className="text-sm font-medium">Entrar</span>
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
      
      {/* Row 2 (mobile only): action icons */}
      {isMobile && (
        <div className="flex items-center justify-end gap-1 mt-1.5 pt-1.5 border-t border-border/20">
          {user && (
            <>
              <div data-tour="notifications">
                {metrics && (
                  <NotificationBell 
                    metrics={metrics} 
                    historyData={historyData}
                    selectedYear={selectedYear}
                  />
                )}
              </div>
              <UserSettingsPanel />
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="icon" className="h-7 w-7 border border-border/50" title="Painel Administrativo">
                    <Shield className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </>
          )}
          {user ? (
            <UserMenu />
          ) : (
            <Link to="/login">
              <Button variant="default" className="h-7 px-2 gap-1" title="Entrar">
                <LogIn className="h-3 w-3" />
                <span className="text-[10px] font-medium">Entrar</span>
              </Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
