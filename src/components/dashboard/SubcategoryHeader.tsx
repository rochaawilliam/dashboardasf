import { cn } from "@/lib/utils";

interface SubcategoryHeaderProps {
  name: string;
  count: number;
}

export function SubcategoryHeader({ name, count }: SubcategoryHeaderProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 mt-3 sm:mt-4 first:mt-0">
      <h4 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
        {name}
      </h4>
      <div className="flex-1 h-px bg-border min-w-4" />
      <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full whitespace-nowrap">
        {count} {count === 1 ? "indicador" : "indicadores"}
      </span>
    </div>
  );
}
