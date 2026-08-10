import { LogIn, User, Settings, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const { profile } = useProfile();
  const isMobile = useIsMobile();

  const initials = (profile?.display_name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "";

  return (
    <header className="dashboard-header mt-2 sm:mt-3 mb-2 sm:mb-4 lg:mb-5 pb-2 sm:pb-4 lg:pb-5 border-b border-border/30">
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        {mobileDrawer}
        
        <img 
          src={asfLogo} 
          alt="ASF - Amaral & Souza Freitas - Advocacia de Negócios" 
          className="h-9 sm:h-12 lg:h-[60px] w-auto"
        />
        <div className="h-8 sm:h-10 lg:h-12 w-px bg-border/50 hidden sm:block landscape-hide" />
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-xl lg:text-[28px] font-semibold text-foreground tracking-tight truncate leading-tight">
            Dashboard Executivo Geral
          </h1>
          <p className="text-muted-foreground text-[8px] sm:text-[10px] lg:text-xs uppercase tracking-wider mt-0.5 leading-tight landscape-hide">
            Desempenho tático e operacional • Administrativo, Crescimento e Jurídico
          </p>
        </div>

        
        {/* Right side: theme toggle + notifications + user avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
          <ThemeToggle />
          
          {user && metrics && (
            <div data-tour="notifications">
              <NotificationBell 
                metrics={metrics} 
                historyData={historyData}
                selectedYear={selectedYear}
              />
            </div>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 outline-none" aria-label="Menu do usuário">
                  <Avatar className={cn("border border-border/50", isMobile ? "h-9 w-9" : "h-11 w-11 lg:h-[60px] lg:w-[60px]")}>
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback className={cn("font-semibold bg-primary/10 text-primary", isMobile ? "text-xs" : "text-sm lg:text-base")}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!isMobile && (
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-sm lg:text-base font-medium text-foreground max-w-[150px] truncate">
                        {displayName}
                      </span>
                      {profile?.job_title && (
                        <span className="text-[10px] lg:text-[11px] text-muted-foreground max-w-[150px] truncate leading-tight">
                          {profile.job_title}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Minha Conta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile?tab=activity" className="cursor-pointer">
                    <Activity className="mr-2 h-4 w-4" />
                    Atividades
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile?tab=settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="default" className={cn(isMobile ? "h-9 px-2.5 gap-1" : "h-11 px-4 gap-1.5")} title="Entrar">
                <LogIn className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
                <span className={cn(isMobile ? "text-xs" : "text-base", "font-medium")}>Entrar</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}