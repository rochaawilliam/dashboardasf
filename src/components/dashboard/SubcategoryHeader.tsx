interface SubcategoryHeaderProps {
  name: string;
  count: number;
}

export function SubcategoryHeader({ name, count }: SubcategoryHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
      <h4 className="text-sm font-medium text-foreground">
        {name}
      </h4>
      <div className="flex-1 h-px bg-border/50" />
      <span className="text-xs text-muted-foreground">
        {count}
      </span>
    </div>
  );
}
