import { Calendar, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { NotificationToggle } from "./NotificationToggle";
import asfLogo from "@/assets/asf-logo.png";
import type { Metric, MetricHistory } from "@/hooks/useMetrics";

interface DashboardHeaderProps {
  metrics?: Metric[];
  historyData?: MetricHistory[];
  selectedYear?: number;
}

export function DashboardHeader({ metrics, historyData, selectedYear = new Date().getFullYear() }: DashboardHeaderProps) {
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="mb-6 sm:mb-8 md:mb-10 pb-4 sm:pb-6 border-b border-border/30">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 sm:gap-5">
          <img 
            src={asfLogo} 
            alt="ASF - Amaral & Souza Freitas - Advocacia de Negócios" 
            className="h-10 sm:h-12 md:h-16 w-auto"
          />
          <div className="h-8 sm:h-12 w-px bg-border/50 hidden sm:block" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-foreground tracking-wide truncate">
              Dashboard de Metas
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-wider mt-0.5 sm:mt-1 truncate">
              Setor de Crescimento • Comercial & Marketing
            </p>
          </div>
        </div>
        
        {/* Actions Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
          {/* Date - hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground bg-card/50 px-3 sm:px-5 py-2 sm:py-2.5 rounded border border-border/30">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span className="capitalize tracking-wide">{currentDate}</span>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {metrics && (
              <NotificationBell 
                metrics={metrics} 
                historyData={historyData}
                selectedYear={selectedYear}
              />
            )}
            <NotificationToggle />
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 border border-border/50" title="Painel Administrativo">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
