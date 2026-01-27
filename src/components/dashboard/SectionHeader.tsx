import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "primary" | "accent" | "success" | "warning";
}

const variantStyles = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  variant = "primary",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className={cn("p-2.5 rounded-lg", variantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <h2 className="section-title mb-0">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
