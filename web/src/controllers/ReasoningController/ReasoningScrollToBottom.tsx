import { ChevronDown } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/classMerge';
import React from 'react';

export const ReasoningScrollToBottom: React.FC<{
  isAutoScrollEnabled: boolean;
  scrollToBottom: () => void;
}> = React.memo(({ isAutoScrollEnabled, scrollToBottom }) => {
  return (
    <div
      className={cn(
        'absolute right-4 bottom-4 z-10 duration-300',
        isAutoScrollEnabled
          ? 'pointer-events-none scale-90 opacity-0'
          : 'pointer-events-auto scale-100 cursor-pointer opacity-100'
      )}>
      <AppTooltip title="Stick to bottom" sideOffset={12} delayDuration={500}>
        <button
          type="button"
          onClick={scrollToBottom}
          className={
            'bg-background/90 hover:bg-item-hover/90 cursor-pointer rounded-full border p-2 shadow transition-all duration-300 hover:scale-105 hover:shadow-md'
          }>
          <ChevronDown />
        </button>
      </AppTooltip>
    </div>
  );
});

ReasoningScrollToBottom.displayName = 'ReasoningScrollToBottom';
