'use client';

import type React from 'react';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useMemo
} from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { cn } from '@/lib/classMerge';
import { Panel } from './Panel';
import { Splitter } from './Splitter';
import { AppSplitterProvider } from './AppSplitterProvider';
import { sizeToPixels, easeInOutCubic, createAutoSaveId } from './helpers';

interface IAppSplitterProps {
  leftChildren: React.ReactNode;
  rightChildren: React.ReactNode;
  autoSaveId: string; //the id of the auto save (this will save the layout to local storage)
  defaultLayout: (string | number)[]; //can be a number (pixels), string (percentage), string (pixels) or 'auto' (the other panel will take the remaining space). One side will always be 'auto'
  leftPanelMinSize?: number | string; //the minimum size of the left panel
  rightPanelMinSize?: number | string; //the minimum size of the right panel
  leftPanelMaxSize?: number | string; //the maximum size of the left panel
  rightPanelMaxSize?: number | string; //the maximum size of the right panel
  className?: string; //the class name of the container
  allowResize?: boolean; //whether the user can resize the panels
  split?: 'vertical' | 'horizontal'; //the direction of the splitter
  splitterClassName?: string; //the class name of the splitter
  preserveSide: 'left' | 'right'; //whether the left or right panel should be preserved when the window is resized, the other side will be 'auto'
  rightHidden?: boolean; //whether the right panel should be hidden
  leftHidden?: boolean; //whether the left panel should be hidden
  style?: React.CSSProperties; //the style of the container
  hideSplitter?: boolean; //whether the splitter should be hidden
  leftPanelClassName?: string; //the class name of the left panel
  rightPanelClassName?: string; //the class name of the right panel
}

export interface AppSplitterRef {
  animateWidth: (
    width: string | number,
    side: 'left' | 'right',
    duration?: number
  ) => Promise<void>;
  setSplitSizes: (sizes: [string | number, string | number]) => void;
  isSideClosed: (side: 'left' | 'right') => boolean;
  getSizesInPixels: () => [number, number];
}

export const AppSplitter = forwardRef<AppSplitterRef, IAppSplitterProps>(
  (
    {
      leftChildren,
      rightChildren,
      autoSaveId,
      defaultLayout,
      leftPanelMinSize = 0,
      rightPanelMinSize = 0,
      leftPanelMaxSize,
      rightPanelMaxSize,
      className,
      allowResize = true,
      split = 'vertical',
      splitterClassName,
      preserveSide,
      rightHidden = false,
      leftHidden = false,
      style,
      hideSplitter: hideSplitterProp = false,
      leftPanelClassName,
      rightPanelClassName
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [sizeSetByAnimation, setSizeSetByAnimation] = useState(false); // Track if current size was set by animation
    const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track if user has ever dragged the splitter
    const startPosRef = useRef(0);
    const startSizeRef = useRef(0);
    const animationRef = useRef<number | null>(null);

    // Parse default layout - removed useCallback since it's not passed as prop
    const getInitialSize = (containerSize: number) => {
      const [leftValue, rightValue] = defaultLayout;
      console.log(leftValue, rightValue, preserveSide);
      if (preserveSide === 'left' && leftValue !== 'auto') {
        return sizeToPixels(leftValue, containerSize);
      } else if (preserveSide === 'right' && rightValue !== 'auto') {
        const rightSize = sizeToPixels(rightValue, containerSize);
        return rightSize; // Return the right panel size directly, not containerSize - rightSize
      }

      // Default fallback
      return 280;
    };

    // Load saved layout from localStorage
    const [savedLayout, setSavedLayout] = useLocalStorageState<number | null>(
      createAutoSaveId(autoSaveId),
      { defaultValue: getInitialSize(containerSize) }
    );

    const isVertical = useMemo(() => split === 'vertical', [split]);

    console.log(savedLayout);

    // Get the current panel size, handling null case
    const currentPanelSize = savedLayout ?? 0;

    // Memoize size calculations to prevent recalculation on every render
    const sizeConstraints = useMemo(() => {
      if (!containerSize) {
        return {
          leftMinPx: 0,
          leftMaxPx: undefined,
          rightMinPx: 0,
          rightMaxPx: undefined
        };
      }

      return {
        leftMinPx: sizeToPixels(leftPanelMinSize, containerSize),
        leftMaxPx: leftPanelMaxSize ? sizeToPixels(leftPanelMaxSize, containerSize) : undefined,
        rightMinPx: sizeToPixels(rightPanelMinSize, containerSize),
        rightMaxPx: rightPanelMaxSize ? sizeToPixels(rightPanelMaxSize, containerSize) : undefined
      };
    }, [containerSize, leftPanelMinSize, rightPanelMinSize, leftPanelMaxSize, rightPanelMaxSize]);

    const { leftMinPx, leftMaxPx, rightMinPx, rightMaxPx } = sizeConstraints;

    const showSplitter = useMemo(() => !leftHidden && !rightHidden, [leftHidden, rightHidden]);

    // Memoize panel size calculations since this is expensive
    const panelSizes = useMemo(() => {
      if (!containerSize) return { leftSize: 0, rightSize: 0 };

      // If we haven't initialized yet, return 0 for both
      if (!isInitialized) {
        return { leftSize: 0, rightSize: 0 };
      }

      if (leftHidden && !rightHidden) {
        return { leftSize: 0, rightSize: containerSize };
      }

      if (rightHidden && !leftHidden) {
        return { leftSize: containerSize, rightSize: 0 };
      }

      if (leftHidden && rightHidden) {
        return { leftSize: 0, rightSize: 0 };
      }

      let leftSize: number;
      let rightSize: number;

      // During animation, don't apply constraints - allow any size including 0
      if (isAnimating) {
        if (preserveSide === 'left') {
          leftSize = currentPanelSize;
          rightSize = containerSize - leftSize;
        } else {
          rightSize = currentPanelSize;
          leftSize = containerSize - rightSize;
        }
        return { leftSize: Math.max(0, leftSize), rightSize: Math.max(0, rightSize) };
      }

      // If size was set by animation, preserve it without applying constraints
      // Only apply constraints when user is actively dragging
      if (sizeSetByAnimation && !isDragging) {
        if (preserveSide === 'left') {
          leftSize = currentPanelSize;
          rightSize = containerSize - leftSize;
        } else {
          rightSize = currentPanelSize;
          leftSize = containerSize - rightSize;
        }
        return { leftSize: Math.max(0, leftSize), rightSize: Math.max(0, rightSize) };
      }

      // Only apply constraints if user has interacted with the splitter
      // This allows default layout to be respected exactly, even if it violates constraints
      if (!hasUserInteracted) {
        if (preserveSide === 'left') {
          leftSize = currentPanelSize;
          rightSize = containerSize - leftSize;
        } else {
          rightSize = currentPanelSize;
          leftSize = containerSize - rightSize;
        }
        return { leftSize: Math.max(0, leftSize), rightSize: Math.max(0, rightSize) };
      }

      // Apply constraint logic only when user has interacted (dragged) the splitter
      if (preserveSide === 'left') {
        leftSize = Math.max(leftMinPx, Math.min(currentPanelSize, leftMaxPx || containerSize));
        rightSize = containerSize - leftSize;

        // Ensure right panel respects its constraints
        if (rightSize < rightMinPx) {
          rightSize = rightMinPx;
          leftSize = containerSize - rightSize;
        }
        if (rightMaxPx && rightSize > rightMaxPx) {
          rightSize = rightMaxPx;
          leftSize = containerSize - rightSize;
        }
      } else {
        rightSize = Math.max(rightMinPx, Math.min(currentPanelSize, rightMaxPx || containerSize));
        leftSize = containerSize - rightSize;

        // Ensure left panel respects its constraints
        if (leftSize < leftMinPx) {
          leftSize = leftMinPx;
          rightSize = containerSize - leftSize;
        }
        if (leftMaxPx && leftSize > leftMaxPx) {
          leftSize = leftMaxPx;
          rightSize = containerSize - leftSize;
        }
      }

      return { leftSize, rightSize };
    }, [
      containerSize,
      isInitialized,
      currentPanelSize,
      preserveSide,
      leftMinPx,
      leftMaxPx,
      rightMinPx,
      rightMaxPx,
      leftHidden,
      rightHidden,
      isAnimating,
      sizeSetByAnimation,
      isDragging,
      hasUserInteracted
    ]);

    const { leftSize, rightSize } = panelSizes;

    const hideSplitter = useMemo(() => {
      return hideSplitterProp || (leftHidden && rightHidden) || leftSize === 0 || rightSize === 0;
    }, [hideSplitterProp, leftHidden, rightHidden, leftSize, rightSize]);

    // Memoize sizes array to prevent recreation on every render
    const sizes = useMemo<[string | number, string | number]>(
      () => [`${leftSize}px`, `${rightSize}px`],
      [leftSize, rightSize]
    );

    // Animation function
    const animateWidth = useCallback(
      async (
        width: string | number,
        side: 'left' | 'right',
        duration: number = 250
      ): Promise<void> => {
        return new Promise((resolve) => {
          if (!containerSize) {
            resolve();
            return;
          }

          // Set animating state to prevent interference
          setIsAnimating(true);

          // Cancel any existing animation
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }

          const targetPixels = sizeToPixels(width, containerSize);
          let targetSize: number;

          if (side === 'left') {
            if (preserveSide === 'left') {
              targetSize = targetPixels;
            } else {
              targetSize = containerSize - targetPixels;
            }
          } else {
            if (preserveSide === 'right') {
              targetSize = targetPixels;
            } else {
              targetSize = containerSize - targetPixels;
            }
          }

          // NO CONSTRAINTS during animation - allow any size including 0
          // This allows animating to 0px regardless of min/max settings

          const startSize = currentPanelSize;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);

            const currentSize = startSize + (targetSize - startSize) * easedProgress;
            setSavedLayout(currentSize);

            if (progress < 1) {
              animationRef.current = requestAnimationFrame(animate);
            } else {
              animationRef.current = null;
              setIsAnimating(false); // Clear animating state when done
              setSizeSetByAnimation(true); // Mark that this size was set by animation
              resolve();
            }
          };

          animationRef.current = requestAnimationFrame(animate);
        });
      },
      [containerSize, preserveSide, currentPanelSize, setSavedLayout]
    );

    // Set split sizes function
    const setSplitSizes = useCallback(
      (sizes: [string | number, string | number]) => {
        if (!containerSize) return;

        const [leftValue, rightValue] = sizes;

        if (preserveSide === 'left' && leftValue !== 'auto') {
          const newSize = sizeToPixels(leftValue, containerSize);
          setSavedLayout(newSize);
          setSizeSetByAnimation(false); // Clear animation flag - size set programmatically
        } else if (preserveSide === 'right' && rightValue !== 'auto') {
          const newSize = sizeToPixels(rightValue, containerSize);
          setSavedLayout(newSize);
          setSizeSetByAnimation(false); // Clear animation flag - size set programmatically
        }
      },
      [containerSize, preserveSide, setSavedLayout]
    );

    // Check if side is closed
    const isSideClosed = useCallback(
      (side: 'left' | 'right') => {
        if (side === 'left') {
          return leftHidden || leftSize === 0;
        } else {
          return rightHidden || rightSize === 0;
        }
      },
      [leftHidden, rightHidden, leftSize, rightSize]
    );

    // Get sizes in pixels
    const getSizesInPixels = useCallback((): [number, number] => {
      return [leftSize, rightSize];
    }, [leftSize, rightSize]);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!allowResize) return;

        setIsDragging(true);
        setHasUserInteracted(true); // Mark that user has interacted with the splitter
        setSizeSetByAnimation(false); // Clear animation flag - user is now controlling the size
        startPosRef.current = isVertical ? e.clientX : e.clientY;
        startSizeRef.current = currentPanelSize;

        e.preventDefault();
      },
      [allowResize, isVertical, currentPanelSize]
    );

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isDragging || !containerSize) return;

        const currentPos = isVertical ? e.clientX : e.clientY;
        const delta = currentPos - startPosRef.current;

        let newSize: number;

        if (preserveSide === 'left') {
          newSize = startSizeRef.current + delta;
          newSize = Math.max(leftMinPx, Math.min(newSize, leftMaxPx || containerSize));

          // Ensure right panel constraints
          const resultingRightSize = containerSize - newSize;
          if (resultingRightSize < rightMinPx) {
            newSize = containerSize - rightMinPx;
          }
          if (rightMaxPx && resultingRightSize > rightMaxPx) {
            newSize = containerSize - rightMaxPx;
          }
        } else {
          newSize = startSizeRef.current - delta;
          newSize = Math.max(rightMinPx, Math.min(newSize, rightMaxPx || containerSize));

          // Ensure left panel constraints
          const resultingLeftSize = containerSize - newSize;

          if (resultingLeftSize < leftMinPx) {
            newSize = containerSize - leftMinPx;
          }
          if (leftMaxPx && resultingLeftSize > leftMaxPx) {
            newSize = containerSize - leftMaxPx;
          }
        }
        setSavedLayout(newSize);
      },
      [
        isDragging,
        isVertical,
        containerSize,
        preserveSide,
        leftMinPx,
        leftMaxPx,
        rightMinPx,
        rightMaxPx,
        setSavedLayout
      ]
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    // Memoize the updateContainerSize function to prevent ResizeObserver recreation
    const updateContainerSize = useCallback(() => {
      if (containerRef.current) {
        const size = isVertical
          ? containerRef.current.offsetWidth
          : containerRef.current.offsetHeight;
        setContainerSize(size);

        // Initialize size ONLY if not initialized yet, not animating, and we have a valid container size
        if (
          !isInitialized && // Only initialize once
          !isAnimating && // Don't override during animation
          size > 0
        ) {
          const initialSize = savedLayout || getInitialSize(size);
          setSavedLayout(initialSize);
          setIsInitialized(true); // Mark as initialized
        }
      }
    }, [isVertical, isInitialized, isAnimating, savedLayout, setSavedLayout]);

    // Update container size
    useEffect(() => {
      updateContainerSize();

      // Use ResizeObserver for better detection of size changes
      const resizeObserver = new ResizeObserver(updateContainerSize);

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      window.addEventListener('resize', updateContainerSize);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateContainerSize);
      };
    }, [updateContainerSize]);

    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = isVertical ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';

        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp, isVertical]);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        animateWidth,
        setSplitSizes,
        isSideClosed,
        getSizesInPixels
      }),
      [animateWidth, setSplitSizes, isSideClosed, getSizesInPixels]
    );

    const content = (
      <div
        ref={containerRef}
        className={cn('flex h-full w-full', isVertical ? 'flex-row' : 'flex-col', className)}
        style={style}>
        <Panel
          className={leftPanelClassName}
          width={isVertical ? leftSize : 'auto'}
          height={!isVertical ? leftSize : 'auto'}
          hidden={leftHidden}>
          {leftChildren}
        </Panel>

        {showSplitter && (
          <Splitter
            onMouseDown={handleMouseDown}
            isDragging={isDragging}
            split={split}
            className={splitterClassName}
            disabled={!allowResize}
            hidden={hideSplitter}
          />
        )}

        <Panel
          className={rightPanelClassName}
          width={isVertical ? rightSize : 'auto'}
          height={!isVertical ? rightSize : 'auto'}
          hidden={rightHidden}>
          {rightChildren}
        </Panel>
      </div>
    );

    return (
      <AppSplitterProvider
        animateWidth={animateWidth}
        setSplitSizes={setSplitSizes}
        isSideClosed={isSideClosed}
        getSizesInPixels={getSizesInPixels}
        sizes={sizes}>
        {content}
      </AppSplitterProvider>
    );
  }
);

AppSplitter.displayName = 'AppSplitter';
