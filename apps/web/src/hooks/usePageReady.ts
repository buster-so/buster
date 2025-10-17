import { useEffect, useState, useTransition } from 'react';

export interface UsePageReadyOptions {
  /**
   * Delay in milliseconds after initial mount before considering page ready
   * @default 25
   */
  delay?: number;
  /**
   * Whether to wait for requestIdleCallback (when browser is idle)
   * @default true
   */
  waitForIdle?: boolean;
  /**
   * Timeout for requestIdleCallback in milliseconds
   * @default 500
   */
  idleTimeout?: number;
  /**
   * Whether to force immediate loading
   * @default false
   */
  forceImmediate?: boolean;
  /**
   * Whether to use React's useTransition for non-urgent updates
   * @default true
   */
  useTransition?: boolean;
}

/**
 * Hook that determines when the page is ready for heavy component loading.
 * Uses React's useTransition to defer non-urgent updates and prevent blocking animations.
 */
export const usePageReady = (options: UsePageReadyOptions = {}) => {
  const {
    delay = 25,
    waitForIdle = true,
    idleTimeout = 375,
    forceImmediate = false,
    useTransition: useTransitionFlag = true,
  } = options;

  const [isReady, setIsReady] = useState(forceImmediate);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (forceImmediate) {
      setIsReady(true);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let idleCallbackId: number;

    const markAsReady = () => {
      if (useTransitionFlag) {
        // Use transition to defer this non-urgent update
        startTransition(() => {
          setIsReady(true);
        });
      } else {
        setIsReady(true);
      }
    };

    const checkReadiness = () => {
      if (waitForIdle && 'requestIdleCallback' in window) {
        // Wait for browser to be idle
        idleCallbackId = requestIdleCallback(markAsReady, { timeout: idleTimeout });
      } else {
        // Fallback: just use the delay
        markAsReady();
      }
    };

    // Initial delay to let any animations or transitions settle
    timeoutId = setTimeout(() => {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        checkReadiness();
      });
    }, delay);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (idleCallbackId) cancelIdleCallback(idleCallbackId);
    };
  }, [delay, waitForIdle, idleTimeout, forceImmediate, useTransitionFlag]);

  return { isReady, isPending };
};
