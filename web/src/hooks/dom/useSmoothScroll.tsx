import { useRef, useState } from 'react';
import { useMemoizedFn, useThrottleFn, useUpdateEffect } from 'ahooks';

export function useSmoothScroller({
  enabled,
  dependencies
}: {
  enabled: boolean;
  dependencies: any[];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isStickyToBottom, setIsStickyToBottom] = useState(true);
  const isUserScrolling = useRef(false);
  const lastContentHeight = useRef(0);
  const lockedScroll = useRef(false);

  const _scrollToBottom = useMemoizedFn(() => {
    const container = scrollContainerRef.current;
    if (!container || lockedScroll.current) return;
    if (container.scrollHeight !== lastContentHeight.current) {
      container.scrollTop = container.scrollHeight;
      lastContentHeight.current = container.scrollHeight;
    }
  });

  const instantScrollLastItemIntoView = useMemoizedFn((id: string) => {
    if (id && scrollContainerRef.current) {
      lockedScroll.current = true;
      const node = scrollContainerRef.current?.querySelector(`#${id}`);
      if (node) {
        node.scrollIntoView({
          behavior: 'instant',
          block: 'start'
        });
      }

      setIsStickyToBottom(true);
      setTimeout(() => {
        lockedScroll.current = false;
      }, 200);
    }
  });

  const { run: scrollToBottom } = useThrottleFn(_scrollToBottom, {
    wait: 250,
    leading: true
  });

  useUpdateEffect(() => {
    const container = scrollContainerRef.current;
    if (!enabled || !container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 1;

      if (isUserScrolling.current) {
        setIsStickyToBottom(isAtBottom);
      }

      if (isAtBottom) {
        isUserScrolling.current = false;
      }
    };

    const handleWheel = () => {
      isUserScrolling.current = true;
    };

    const handleTouchStart = () => {
      isUserScrolling.current = true;
    };

    scrollToBottom();

    container.addEventListener('scroll', handleScroll);
    container.addEventListener('wheel', handleWheel);
    container.addEventListener('touchstart', handleTouchStart);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [scrollToBottom]);

  useUpdateEffect(() => {
    if (enabled && isStickyToBottom && !lockedScroll.current) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [isStickyToBottom, dependencies]);

  return {
    scrollContainerRef,
    isStickyToBottom,
    setIsStickyToBottom,
    instantScrollLastItemIntoView
  };
}

export default useSmoothScroller;
