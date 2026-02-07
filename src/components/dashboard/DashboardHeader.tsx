import { Shield, LogIn, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { TourButton } from "./GuidedTour";
import { UserSettingsPanel } from "./UserSettingsPanel";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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

  return (
    <header className="mb-4 sm:mb-6 pb-4 sm:pb-5 border-b border-border/30">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile drawer trigger */}
        {mobileDrawer}
        
        <img 
          src={asfLogo} 
          alt="ASF - Amaral & Souza Freitas - Advocacia de Negócios" 
          className="h-10 sm:h-12 md:h-14 w-auto"
        />
        <div className="h-8 sm:h-10 w-px bg-border/50 hidden sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground tracking-wide truncate">
            Dashboard de Metas
          </h1>
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider mt-0.5 truncate">
            Setor de Crescimento • Comercial & Marketing
          </p>
        </div>
        
        {/* Action buttons - inline with header */}
        <div className="flex items-center gap-1.5 sm:gap-2">
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 border border-border/50" title="Painel Administrativo">
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              )}
            </>
          )}
          
          {/* Login button - always visible */}
          <Link to="/login">
            <Button 
              variant={user ? "ghost" : "default"} 
              size="icon" 
              className="h-8 w-8 sm:h-9 sm:w-9"
              title={user ? `Logado como ${user.email}` : "Entrar"}
            >
              {user ? (
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
