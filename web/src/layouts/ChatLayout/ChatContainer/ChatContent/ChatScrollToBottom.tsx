import React from 'react';
import { ChevronDown } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import type { useAutoScroll } from '@/hooks/useAutoScroll';
import { cn } from '@/lib/utils';

export const ChatScrollToBottom: React.FC<{
  isAutoScrollEnabled: boolean;
  scrollToBottom: ReturnType<typeof useAutoScroll>['scrollToBottom'];
}> = React.memo(({ isAutoScrollEnabled, scrollToBottom }) => {
  return (
    <div
      className={cn(
        'absolute -top-9 right-3 z-10 transition-all duration-300 hover:scale-105',
        isAutoScrollEnabled
          ? 'pointer-events-none scale-90 opacity-0'
          : 'pointer-events-auto scale-100 cursor-pointer opacity-100'
      )}>
      <AppTooltip title="Stick to bottom" sideOffset={12} delayDuration={500}>
        <button
          type="button"
          onClick={scrollToBottom}
          className={
            'bg-background/90 hover:bg-item-hover/90 cursor-pointer rounded-full border p-2 shadow transition-all duration-300 hover:shadow-md'
          }>
          <ChevronDown />
        </button>
      </AppTooltip>
    </div>
  );
});

ChatScrollToBottom.displayName = 'ChatScrollToBottom';
