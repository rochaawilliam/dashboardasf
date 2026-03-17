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
    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
      <div className={cn(
        "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0",
        variantStyles[variant]
      )}>
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
      <div className="min-w-0">
        <h3 
          className="text-sm sm:text-base md:text-lg font-semibold text-foreground leading-tight"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          {title}
        </h3>
        <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
