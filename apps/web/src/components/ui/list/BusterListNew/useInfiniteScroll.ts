import { useEffect, useRef } from 'react';
import type { InfiniteScrollConfig } from './interfaces';

interface UseInfiniteScrollParams {
  scrollElementRef: React.RefObject<HTMLElement | null>;
  infiniteScrollConfig?: InfiniteScrollConfig;
}

export function useInfiniteScroll({
  scrollElementRef,
  infiniteScrollConfig,
}: UseInfiniteScrollParams) {
  const hasTriggeredScrollEnd = useRef(false);

  useEffect(() => {
    if (!infiniteScrollConfig) return;
    const { onScrollEnd, scrollEndThreshold = 50, loadingNewContent } = infiniteScrollConfig;
    const scrollElement = scrollElementRef.current;

    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Check if we're within the threshold zone
      if (distanceFromBottom <= scrollEndThreshold) {
        // Fire only once and not while loading
        if (!hasTriggeredScrollEnd.current) {
          hasTriggeredScrollEnd.current = true;
          onScrollEnd();
        }
      } else {
        // Reset when scrolling back up above threshold
        hasTriggeredScrollEnd.current = false;
      }
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [infiniteScrollConfig, scrollElementRef]);
}
