import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "primary" | "accent" | "success" | "warning";
}

const variantStyles = {
  primary: "bg-primary/15 text-primary border-primary/20",
  accent: "bg-primary/15 text-primary border-primary/20",
  success: "bg-success/15 text-success border-success/20",
  warning: "bg-warning/15 text-warning border-warning/20",
};

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  variant = "primary",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {Icon && (
        <div className={cn("p-3 rounded border", variantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <h2 className="font-cinzel text-2xl md:text-3xl font-semibold tracking-wide text-foreground leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground tracking-wide mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent ml-4" />
    </div>
  );
}
