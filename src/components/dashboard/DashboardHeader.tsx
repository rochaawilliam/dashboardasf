import { Shield, LogIn, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { TourButton } from "./GuidedTour";
import { UserSettingsPanel } from "./UserSettingsPanel";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import asfLogo from "@/assets/asf-logo.png";
import type { Metric, MetricHistory } from "@/hooks/useMetrics";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  const [actionsOpen, setActionsOpen] = useState(false);

  const actionButtons = (
    <>
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
          {!isMobile && <TourButton />}
          <UserSettingsPanel />
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="icon" className={cn(isMobile ? "h-7 w-7" : "h-9 w-9", "border border-border/50")} title="Painel Administrativo">
                <Shield className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
              </Button>
            </Link>
          )}
        </>
      )}
      {user ? (
        <UserMenu />
      ) : (
        <Link to="/login">
          <Button variant="default" className={cn(isMobile ? "h-7 px-2 gap-1" : "h-9 px-3 gap-1")} title="Entrar">
            <LogIn className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
            <span className={cn(isMobile ? "text-[10px]" : "text-sm", "font-medium")}>Entrar</span>
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <header className="mb-2 sm:mb-4 pb-2 sm:pb-4 border-b border-border/30">
      <div className="flex items-center gap-1.5 sm:gap-3">
        {mobileDrawer}
        
        <img 
          src={asfLogo} 
          alt="ASF - Amaral & Souza Freitas - Advocacia de Negócios" 
          className="h-7 sm:h-10 md:h-11 w-auto"
        />
        <div className="h-6 sm:h-8 w-px bg-border/50 hidden sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-foreground tracking-wide sm:truncate leading-tight">
            Dashboard de Metas
          </h1>
          <p className="text-muted-foreground text-[8px] sm:text-[11px] uppercase tracking-wider mt-0.5 leading-tight">
            Setor de Crescimento • Comercial & Marketing
          </p>
        </div>
        
        {/* Desktop: inline actions */}
        {!isMobile && (
          <div className="flex items-center gap-1 sm:gap-2">
            {actionButtons}
          </div>
        )}

        {/* Mobile: collapsible menu trigger */}
        {isMobile && (
          <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="icon" className="h-7 w-7 shrink-0">
                <Menu className="h-3.5 w-3.5" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>
      
      {/* Mobile: expandable actions row */}
      {isMobile && (
        <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
          <CollapsibleContent>
            <div className="flex items-center justify-end gap-1.5 mt-1.5 pt-1.5 border-t border-border/20">
              {actionButtons}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </header>
  );
}
