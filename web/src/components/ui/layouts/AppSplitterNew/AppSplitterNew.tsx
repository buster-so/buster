'use client';

import type React from 'react';

import { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { cn } from '@/lib/classMerge';
import { Panel } from './Panel';
import { Splitter } from './Splitter';
import { AppSplitterNewProvider } from './AppSplitterNewProvider';

interface IAppSplitterNewProps {
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
}

export interface AppSplitterNewHandle {
  animateWidth: (width: string | number, side: 'left' | 'right', duration: number) => Promise<void>;
  setSplitSizes: (sizes: [string | number, string | number]) => void;
  isSideClosed: (side: 'left' | 'right') => boolean;
  getSizesInPixels: () => [number, number];
}

// Helper function to convert size values to pixels
const sizeToPixels = (size: string | number, containerSize: number): number => {
  if (typeof size === 'number') {
    return size;
  }

  const sizeStr = size.toString();

  if (sizeStr.endsWith('%')) {
    const percentage = parseFloat(sizeStr) / 100;
    return Math.round(containerSize * percentage);
  }

  if (sizeStr.endsWith('px')) {
    return parseFloat(sizeStr);
  }

  // Default to parsing as number
  return parseFloat(sizeStr) || 0;
};

// Ease-in-out cubic easing function
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const AppSplitterNew = forwardRef<AppSplitterNewHandle, IAppSplitterNewProps>(
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
      hideSplitter = false
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startPosRef = useRef(0);
    const startSizeRef = useRef(0);
    const animationRef = useRef<number | null>(null);

    const isVertical = split === 'vertical';

    // Parse default layout
    const getInitialSize = useCallback(
      (containerSize: number) => {
        const [leftValue, rightValue] = defaultLayout;

        if (preserveSide === 'left' && leftValue !== 'auto') {
          return sizeToPixels(leftValue, containerSize);
        } else if (preserveSide === 'right' && rightValue !== 'auto') {
          const rightSize = sizeToPixels(rightValue, containerSize);
          return containerSize - rightSize;
        }

        // Default fallback
        return 280;
      },
      [defaultLayout, preserveSide]
    );

    // Load saved layout from localStorage
    const [savedLayout, setSavedLayout] = useLocalStorageState<number | null>(
      `splitter-${autoSaveId}`,
      { defaultValue: null }
    );

    const [preservedPanelSize, setPreservedPanelSize] = useState<number>(() => {
      return savedLayout || 0;
    });

    // Update container size
    useEffect(() => {
      const updateContainerSize = () => {
        if (containerRef.current) {
          const size = isVertical
            ? containerRef.current.offsetWidth
            : containerRef.current.offsetHeight;
          setContainerSize(size);

          // Initialize size on first mount or when going from 0 to a real size
          if (
            size > 0 &&
            (preservedPanelSize === 0 || (!savedLayout && preservedPanelSize === 280))
          ) {
            const initialSize = savedLayout || getInitialSize(size);
            setPreservedPanelSize(initialSize);
          }
        }
      };

      updateContainerSize();

      // Use ResizeObserver for better detection of size changes
      const resizeObserver = new ResizeObserver(() => {
        updateContainerSize();
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      window.addEventListener('resize', updateContainerSize);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateContainerSize);
      };
    }, [isVertical, savedLayout, getInitialSize, preservedPanelSize]);

    // Convert min/max sizes to pixels
    const leftMinPx = containerSize ? sizeToPixels(leftPanelMinSize, containerSize) : 0;
    const leftMaxPx =
      leftPanelMaxSize && containerSize ? sizeToPixels(leftPanelMaxSize, containerSize) : undefined;
    const rightMinPx = containerSize ? sizeToPixels(rightPanelMinSize, containerSize) : 0;
    const rightMaxPx =
      rightPanelMaxSize && containerSize
        ? sizeToPixels(rightPanelMaxSize, containerSize)
        : undefined;

    // Calculate actual panel sizes
    const calculatePanelSizes = useCallback(() => {
      if (!containerSize) return { leftSize: 0, rightSize: 0 };

      // If we haven't initialized yet (preservedPanelSize is 0), return 0 for both
      if (preservedPanelSize === 0 && !savedLayout) {
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

      if (preserveSide === 'left') {
        leftSize = Math.max(leftMinPx, Math.min(preservedPanelSize, leftMaxPx || containerSize));
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
        rightSize = Math.max(rightMinPx, Math.min(preservedPanelSize, rightMaxPx || containerSize));
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
      preservedPanelSize,
      preserveSide,
      leftMinPx,
      leftMaxPx,
      rightMinPx,
      rightMaxPx,
      leftHidden,
      rightHidden
    ]);

    const { leftSize, rightSize } = calculatePanelSizes();

    // Animation function
    const animateWidth = useCallback(
      async (
        width: string | number,
        side: 'left' | 'right',
        duration: number = 200
      ): Promise<void> => {
        return new Promise((resolve) => {
          if (!containerSize) {
            resolve();
            return;
          }

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

          // Apply constraints
          if (preserveSide === 'left') {
            targetSize = Math.max(leftMinPx, Math.min(targetSize, leftMaxPx || containerSize));
            const resultingRightSize = containerSize - targetSize;
            if (resultingRightSize < rightMinPx) {
              targetSize = containerSize - rightMinPx;
            }
            if (rightMaxPx && resultingRightSize > rightMaxPx) {
              targetSize = containerSize - rightMaxPx;
            }
          } else {
            targetSize = Math.max(rightMinPx, Math.min(targetSize, rightMaxPx || containerSize));
            const resultingLeftSize = containerSize - targetSize;
            if (resultingLeftSize < leftMinPx) {
              targetSize = containerSize - leftMinPx;
            }
            if (leftMaxPx && resultingLeftSize > leftMaxPx) {
              targetSize = containerSize - leftMaxPx;
            }
          }

          const startSize = preservedPanelSize;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);

            const currentSize = startSize + (targetSize - startSize) * easedProgress;
            setPreservedPanelSize(currentSize);

            if (progress < 1) {
              animationRef.current = requestAnimationFrame(animate);
            } else {
              animationRef.current = null;
              setSavedLayout(targetSize);
              resolve();
            }
          };

          animationRef.current = requestAnimationFrame(animate);
        });
      },
      [
        containerSize,
        preserveSide,
        leftMinPx,
        leftMaxPx,
        rightMinPx,
        rightMaxPx,
        preservedPanelSize,
        setSavedLayout
      ]
    );

    // Set split sizes function
    const setSplitSizes = useCallback(
      (sizes: [string | number, string | number]) => {
        if (!containerSize) return;

        const [leftValue, rightValue] = sizes;

        if (preserveSide === 'left' && leftValue !== 'auto') {
          const newSize = sizeToPixels(leftValue, containerSize);
          setPreservedPanelSize(newSize);
          setSavedLayout(newSize);
        } else if (preserveSide === 'right' && rightValue !== 'auto') {
          const newSize = sizeToPixels(rightValue, containerSize);
          setPreservedPanelSize(newSize);
          setSavedLayout(newSize);
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

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!allowResize) return;

        setIsDragging(true);
        startPosRef.current = isVertical ? e.clientX : e.clientY;
        startSizeRef.current = preservedPanelSize;

        e.preventDefault();
      },
      [allowResize, isVertical, preservedPanelSize]
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
        setPreservedPanelSize(newSize);
      },
      [
        isDragging,
        isVertical,
        containerSize,
        preserveSide,
        leftMinPx,
        leftMaxPx,
        rightMinPx,
        rightMaxPx
      ]
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
      setSavedLayout(preservedPanelSize);
    }, [preservedPanelSize, setSavedLayout]);

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

    const showSplitter = !leftHidden && !rightHidden;

    // Calculate current sizes for context
    const sizes: [string | number, string | number] = [`${leftSize}px`, `${rightSize}px`];

    const content = (
      <div
        ref={containerRef}
        className={cn('flex h-full w-full', isVertical ? 'flex-row' : 'flex-col', className)}
        style={style}>
        <Panel
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
          width={isVertical ? rightSize : 'auto'}
          height={!isVertical ? rightSize : 'auto'}
          hidden={rightHidden}>
          {rightChildren}
        </Panel>
      </div>
    );

    return (
      <AppSplitterNewProvider
        animateWidth={animateWidth}
        setSplitSizes={setSplitSizes}
        isSideClosed={isSideClosed}
        getSizesInPixels={getSizesInPixels}
        sizes={sizes}>
        {content}
      </AppSplitterNewProvider>
    );
  }
);

AppSplitterNew.displayName = 'AppSplitterNew';
