import React from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

/**
 * Hook to handle scroll-to-bottom detection
 * Fires callback when user scrolls within threshold distance of bottom
 * Only fires when entering the zone, not while remaining in it
 */
export const useScrollToBottom = (
  onScrollToBottom?: () => void,
  threshold = 15
): ((e: React.UIEvent<HTMLDivElement>) => void) => {
  const isInBottomZoneRef = React.useRef(false);

  const handleScroll = useMemoizedFn((e: React.UIEvent<HTMLDivElement>) => {
    if (!onScrollToBottom) return;

    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    const isNowInZone = scrollBottom <= threshold;

    // Only fire when entering the zone (not already in it)
    if (isNowInZone && !isInBottomZoneRef.current) {
      onScrollToBottom();
    }

    // Update the ref to track current state
    isInBottomZoneRef.current = isNowInZone;
  });

  return handleScroll;
};
