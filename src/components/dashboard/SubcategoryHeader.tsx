import { cn } from "@/lib/utils";

interface SubcategoryHeaderProps {
  name: string;
  count: number;
}

export function SubcategoryHeader({ name, count }: SubcategoryHeaderProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 mt-4 sm:mt-6 first:mt-0">
      <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {name}
      </h4>
      <div className="flex-1 h-px bg-border min-w-4" />
      <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
        {count} {count === 1 ? "indicador" : "indicadores"}
      </span>
    </div>
  );
}
