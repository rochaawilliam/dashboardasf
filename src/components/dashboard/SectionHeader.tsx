import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  variant?: "primary" | "accent" | "success" | "warning";
}

const variantStyles = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-primary/10 text-primary",
  success: "bg-primary/10 text-primary",
  warning: "bg-primary/10 text-primary",
};

export function SectionHeader({ title, subtitle, icon: Icon, variant = "primary" }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-3 sm:mb-4">
      <div className={cn(
        "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex-shrink-0",
        variantStyles[variant]
      )}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <h3 
          className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground leading-tight"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          {title}
        </h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
