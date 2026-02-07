import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  variant?: "primary" | "accent" | "success" | "warning";
}

export function SectionHeader({ title, subtitle, icon: Icon, variant = "primary" }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground ml-8">{subtitle}</p>
    </div>
  );
}
