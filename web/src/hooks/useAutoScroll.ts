import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAutoScrollOptions {
  /** Whether auto-scroll is enabled at start */
  enabled?: boolean;
  /**
   * A threshold (in pixels) that defines what "at the bottom" means.
   * When the user is within this threshold from the bottom, auto-scroll will re–engage.
   */
  bottomThreshold?: number;
  /**
   * Easing factor determines how aggressively we "chase" the bottom.
   * It is a fraction (0–1) of the remaining distance applied each frame.
   * Typical values: 0.2–0.3.
   */
  chaseEasing?: number;

  /**
   * Whether to observe deep changes in the container.
   * If true, the hook will observe changes to the container's content and scroll position.
   * If false, the hook will only observe changes to the container's scroll position.
   */
  observeSubTree?: boolean;
  observeCharacterData?: boolean;
  observeAttributes?: boolean;

  /**
   * Duration in milliseconds to continue animations after a mutation.
   * Default is 500ms.
   */
  animationCooldown?: number;
}

interface UseAutoScrollReturn {
  /** Whether auto-scroll is currently enabled */
  isAutoScrollEnabled: boolean;
  /** Manually scroll to the bottom (and enable auto–scroll) */
  scrollToBottom: () => void;
  /** Manually scroll to the top (and disable auto–scroll) */
  scrollToTop: () => void;
  /** Manually scroll to a specific node (disables auto–scroll unless near bottom) */
  scrollToNode: (node: HTMLElement) => void;
  /** Enable auto–scroll */
  enableAutoScroll: () => void;
  /** Disable auto–scroll */
  disableAutoScroll: () => void;
}

/**
 * Checks whether an element is "at the bottom" using a pixel threshold.
 */
const isAtBottom = (element: HTMLElement, threshold = 30): boolean => {
  const { scrollHeight, scrollTop, clientHeight } = element;
  return scrollHeight - (scrollTop + clientHeight) <= threshold;
};

/**
 * Custom hook that "sticks" a container to its bottom while auto–scroll is enabled.
 *
 * It uses a MutationObserver to watch for changes to the container's content
 * and adjusts the scroll position with a hybrid approach:
 * - Uses requestAnimationFrame for smooth scrolling
 * - Only continues animation for a limited time after mutations are detected
 * - Stops animation completely when no new content is being added
 *
 * When the container is scrolled back near the bottom (within bottomThreshold), auto–scroll
 * is re–enabled.
 */
export const useAutoScroll = (
  containerRef: React.RefObject<HTMLElement>,
  options: UseAutoScrollOptions = {}
): UseAutoScrollReturn => {
  const {
    enabled = true,
    bottomThreshold = 50,
    chaseEasing = 0.2,
    observeSubTree = true,
    observeCharacterData = false,
    observeAttributes = false,
    animationCooldown = 500
  } = options;

  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(enabled);
  const observerRef = useRef<MutationObserver | null>(null);
  const rAFIdRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMutationTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);

  // Function to handle smooth scrolling with requestAnimationFrame
  const animateScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !isAutoScrollEnabled) {
      isAnimatingRef.current = false;
      return;
    }

    const target = container.scrollHeight;
    const current = container.scrollTop;
    const gap = target - (current + container.clientHeight);
    const now = Date.now();

    // If gap is significant, apply easing
    if (gap > 1) {
      container.scrollTop = current + gap * chaseEasing;

      // Continue animation only if we're within the cooldown period from last mutation
      if (now - lastMutationTimeRef.current < animationCooldown) {
        rAFIdRef.current = requestAnimationFrame(animateScroll);
      } else {
        // If cooldown expired, stop animation
        isAnimatingRef.current = false;
      }
    } else if (gap > 0) {
      // If gap is small, snap to bottom
      container.scrollTop = target;
      isAnimatingRef.current = false;
    } else {
      // No gap, animation complete
      isAnimatingRef.current = false;
    }
  }, [containerRef, chaseEasing, isAutoScrollEnabled, animationCooldown]);

  // Start animation when mutations are observed
  const startScrollAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;

    // Record timestamp of the mutation
    lastMutationTimeRef.current = Date.now();
    isAnimatingRef.current = true;

    // Clear existing timeout if there is one
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    // Start animation
    if (rAFIdRef.current) {
      cancelAnimationFrame(rAFIdRef.current);
    }
    rAFIdRef.current = requestAnimationFrame(animateScroll);

    // Set a final timeout to ensure animation stops after cooldown
    animationTimeoutRef.current = setTimeout(() => {
      if (rAFIdRef.current) {
        cancelAnimationFrame(rAFIdRef.current);
        rAFIdRef.current = null;
      }
      isAnimatingRef.current = false;
    }, animationCooldown + 50); // Add a small buffer
  }, [animateScroll, animationCooldown]);

  // Set up the mutation observer
  useEffect(() => {
    const container = containerRef.current;

    if (!container || !isAutoScrollEnabled) return;

    // Clean up previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (isAutoScrollEnabled) {
      // Create a new observer
      observerRef.current = new MutationObserver((mutations) => {
        if (isAutoScrollEnabled) {
          startScrollAnimation();
        }
      });

      // Configure observer to watch for changes
      const observerConfig = {
        childList: true,
        subtree: observeSubTree,
        characterData: observeCharacterData,
        attributes: observeAttributes
      };

      // Start observing
      observerRef.current.observe(container, observerConfig);

      // Initial scroll to bottom without animation
      container.scrollTop = container.scrollHeight;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (rAFIdRef.current) {
        cancelAnimationFrame(rAFIdRef.current);
        rAFIdRef.current = null;
      }

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [
    isAutoScrollEnabled,
    containerRef,
    startScrollAnimation,
    observeSubTree,
    observeCharacterData,
    observeAttributes,
    animationCooldown
  ]);

  // Listen for user–initiated events. Only disable auto–scroll if the container isn't near the bottom.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isAutoScrollEnabled) return;

    const disableAutoScrollHandler = () => {
      // Only disable auto–scroll if we're not near the bottom.
      if (!isAtBottom(container, bottomThreshold)) {
        setIsAutoScrollEnabled(false);

        // Stop any ongoing animations
        if (rAFIdRef.current) {
          cancelAnimationFrame(rAFIdRef.current);
          rAFIdRef.current = null;
        }

        isAnimatingRef.current = false;
      }
      // Otherwise, if the container is at the bottom, leave auto–scroll enabled.
    };

    container.addEventListener('wheel', disableAutoScrollHandler, { passive: true });
    container.addEventListener('touchstart', disableAutoScrollHandler, { passive: true });
    container.addEventListener('mousedown', disableAutoScrollHandler, { passive: true });

    return () => {
      container.removeEventListener('wheel', disableAutoScrollHandler);
      container.removeEventListener('touchstart', disableAutoScrollHandler);
      container.removeEventListener('mousedown', disableAutoScrollHandler);
    };
  }, [containerRef, bottomThreshold, isAutoScrollEnabled]);

  // Listen for scroll events. If the user scrolls back close to the bottom, re-enable auto–scroll.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (isAtBottom(container, bottomThreshold)) {
        setIsAutoScrollEnabled(true);
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
    };
  }, [containerRef, isAutoScrollEnabled, bottomThreshold]);

  // Exposed functions.

  // Immediately scroll to bottom and enable auto–scroll.
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    setIsAutoScrollEnabled(true);
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [containerRef]);

  // Scroll to top and disable auto–scroll.
  const scrollToTop = useCallback(() => {
    if (!containerRef.current) return;
    setIsAutoScrollEnabled(false);
    containerRef.current.scrollTop = 0;
  }, [containerRef]);

  // Scroll to a specific node and disable auto–scroll.
  const scrollToNode = useCallback(
    (node: HTMLElement) => {
      if (!containerRef.current || !node) return;
      setIsAutoScrollEnabled(false);
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      // Calculate the target scroll position relative to the container.
      const targetScroll = container.scrollTop + (nodeRect.top - containerRect.top);
      container.scrollTop = targetScroll;
    },
    [containerRef]
  );

  const enableAutoScroll = useCallback(() => {
    setIsAutoScrollEnabled(true);
  }, []);

  const disableAutoScroll = useCallback(() => {
    setIsAutoScrollEnabled(false);
  }, []);

  return {
    isAutoScrollEnabled,
    scrollToBottom,
    scrollToTop,
    scrollToNode,
    enableAutoScroll,
    disableAutoScroll
  };
};
