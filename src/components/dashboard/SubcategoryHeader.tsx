import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SubcategoryHeaderProps {
  name: string;
  count: number;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export function SubcategoryHeader({ name, count, defaultCollapsed = false, collapsible = false, onToggle }: SubcategoryHeaderProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    if (!collapsible) return;
    const next = !collapsed;
    setCollapsed(next);
    onToggle?.(next);
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 mt-3 sm:mt-4 first:mt-0 min-w-0',
        collapsible && 'cursor-pointer select-none hover:opacity-80'
      )}
      onClick={handleToggle}
    >
      {collapsible && (
        collapsed 
          ? <ChevronRight className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0' />
          : <ChevronDown className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0' />
      )}
      <h4 className='text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-0 truncate'>
        {name}
      </h4>
      <div className='flex-1 h-px bg-border min-w-4' />
      <span className='text-[9px] sm:text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0'>
        {count} {count === 1 ? 'indicador' : 'indicadores'}
      </span>
    </div>
  );
}
