import { Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/dashboard/UserMenu";
import asfLogo from "@/assets/asf-logo.png";

export function DashboardHeader() {
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="mb-10 pb-6 border-b border-border/30">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-5">
          <img 
            src={asfLogo} 
            alt="ASF - Amaral & Souza Freitas - Advocacia de Negócios" 
            className="h-14 md:h-16 w-auto"
          />
          <div className="h-12 w-px bg-border/50" />
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-wide">
              Dashboard de Metas
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-wider mt-1">
              Setor de Crescimento • Comercial & Marketing
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground bg-card/50 px-5 py-2.5 rounded border border-border/30">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="capitalize tracking-wide">{currentDate}</span>
          </div>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
