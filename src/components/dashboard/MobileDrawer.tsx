import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, DollarSign, Rocket, Zap, Users, GraduationCap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { MetricCategory } from "@/hooks/useMetrics";
import asfLogo from "@/assets/asf-logo.png";

interface MobileDrawerProps {
  activeTab: MetricCategory;
  onTabChange: (tab: MetricCategory) => void;
  categoryMetricsCounts: Record<MetricCategory, number>;
}

const categories: { id: MetricCategory; title: string; icon: any; variant: string }[] = [
  { id: "lucratividade", title: "Lucratividade", icon: DollarSign, variant: "primary" },
  { id: "experiencia_cliente", title: "Gestão de Crescimento", icon: Rocket, variant: "accent" },
  { id: "produtividade", title: "Produtividade", icon: Zap, variant: "warning" },
  { id: "gestao_pessoas", title: "Gestão de Pessoas", icon: Users, variant: "success" },
  { id: "aprendizado_crescimento", title: "Aprendizado e Crescimento", icon: GraduationCap, variant: "primary" },
];

const variantStyles: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function MobileDrawer({ activeTab, onTabChange, categoryMetricsCounts }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);

  const handleTabClick = (tab: MetricCategory) => {
    onTabChange(tab);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="sm:hidden h-9 w-9 border-border/50"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img 
              src={asfLogo} 
              alt="ASF" 
              className="h-8 w-auto"
            />
            <div>
              <SheetTitle className="text-base text-left">Dashboard de Metas</SheetTitle>
              <p className="text-xs text-muted-foreground">Navegação</p>
            </div>
          </div>
        </SheetHeader>
        
        <nav className="p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Categorias
          </p>
          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeTab === category.id;
              const count = categoryMetricsCounts[category.id] || 0;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleTabClick(category.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                    isActive 
                      ? "bg-primary/10 text-foreground" 
                      : "hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
                    variantStyles[category.variant]
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isActive && "text-foreground"
                    )}>
                      {category.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {count} indicadores
                    </p>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] text-muted-foreground text-center">
            Deslize horizontalmente nas abas para navegar
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}