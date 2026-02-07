import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { TourButton } from "./GuidedTour";
import { UserSettingsPanel } from "./UserSettingsPanel";
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
  return (
    <header className="mb-6 pb-4">
      <div className="flex items-center gap-4">
        {/* Mobile drawer trigger */}
        {mobileDrawer}
        
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Setor de Crescimento • Comercial & Marketing
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
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
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" title="Painel Administrativo">
              <Shield className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
