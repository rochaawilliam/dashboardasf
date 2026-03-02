import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableCardWrapperProps {
  id: string;
  children: React.ReactNode;
  isDragMode: boolean;
}

export function DraggableCardWrapper({ id, children, isDragMode }: DraggableCardWrapperProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("h-full relative group/drag", isDragging && "ring-2 ring-primary rounded-xl")}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 p-1 rounded bg-background/80 backdrop-blur-sm border border-border/50 cursor-grab active:cursor-grabbing opacity-0 group-hover/drag:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}
