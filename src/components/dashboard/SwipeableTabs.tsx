import { useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsLandscapeMobile } from "@/hooks/use-orientation";


interface SwipeableTabsProps<T extends string> {
  tabs: T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  children: ReactNode;
  className?: string;
}

export function SwipeableTabs<T extends string>({ 
  tabs, 
  activeTab, 
  onTabChange, 
  children,
  className 
}: SwipeableTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    const currentIndex = tabs.indexOf(activeTab);
    
    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      // Swipe left -> next tab
      onTabChange(tabs[currentIndex + 1]);
    } else if (isRightSwipe && currentIndex > 0) {
      // Swipe right -> previous tab
      onTabChange(tabs[currentIndex - 1]);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={cn("touch-pan-y", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
      
      {/* Swipe indicator dots */}
      <div className="flex items-center justify-center gap-1.5 py-3 sm:hidden">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              activeTab === tab 
                ? "bg-primary w-4" 
                : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
