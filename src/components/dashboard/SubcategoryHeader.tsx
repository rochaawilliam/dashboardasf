import { cn } from "@/lib/utils";

interface SubcategoryHeaderProps {
  name: string;
  count: number;
}

export function SubcategoryHeader({ name, count }: SubcategoryHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-6 first:mt-0">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {name}
      </h4>
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {count} {count === 1 ? "indicador" : "indicadores"}
      </span>
    </div>
  );
}
