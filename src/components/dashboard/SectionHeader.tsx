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
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
      <div className={cn(
        "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0",
        variantStyles[variant]
      )}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <div className="min-w-0">
        <h3 
          className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground leading-tight"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
