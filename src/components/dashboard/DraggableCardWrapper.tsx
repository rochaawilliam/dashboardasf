import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SubcategoryOption {
  id: string;
  name: string;
}

interface DraggableCardWrapperProps {
  id: string;
  children: React.ReactNode;
  isDragMode: boolean;
  currentSubcategoryId?: string;
  availableSubcategories?: SubcategoryOption[];
  onMoveToSubcategory?: (metricId: string, subcategoryId: string) => void;
}

export function DraggableCardWrapper({ id, children, isDragMode, currentSubcategoryId, availableSubcategories, onMoveToSubcategory }: DraggableCardWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDragMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  if (!isDragMode) {
    return <div className="h-full">{children}</div>;
  }

  const otherSubcategories = availableSubcategories?.filter((s) => s.id !== currentSubcategoryId) || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("h-full relative group/drag", isDragging && "ring-2 ring-primary rounded-xl")}
    >
      <div className="absolute top-1 left-1 z-10 flex gap-1">
        <div
          {...attributes}
          {...listeners}
          className="p-1 rounded bg-background/80 backdrop-blur-sm border border-border/50 cursor-grab active:cursor-grabbing opacity-0 group-hover/drag:opacity-100 transition-opacity"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
        {otherSubcategories.length > 0 && onMoveToSubcategory && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border-border/50 opacity-0 group-hover/drag:opacity-100 transition-opacity"
              >
                <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Mover para:</div>
              {otherSubcategories.map((sub) => (
                <DropdownMenuItem
                  key={sub.id}
                  onClick={() => onMoveToSubcategory(id, sub.id)}
                  className="text-xs"
                >
                  {sub.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {children}
    </div>
  );
}
