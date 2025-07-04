'use client';

import React, {
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
import { useMemoizedFn } from '@/hooks';

interface IAppSplitterProps {
  leftChildren: React.ReactNode;
  rightChildren: React.ReactNode;
  autoSaveId: string;
  defaultLayout: (string | number)[];
  leftPanelMinSize?: number | string;
  rightPanelMinSize?: number | string;
  leftPanelMaxSize?: number | string;
  rightPanelMaxSize?: number | string;
  className?: string;
  allowResize?: boolean;
  split?: 'vertical' | 'horizontal';
  splitterClassName?: string;
  preserveSide: 'left' | 'right';
  rightHidden?: boolean;
  leftHidden?: boolean;
  style?: React.CSSProperties;
  hideSplitter?: boolean;
  leftPanelClassName?: string;
  rightPanelClassName?: string;
  bustStorageOnInit?: boolean;
  renderLeftPanel?: boolean;
  renderRightPanel?: boolean;
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

// Consolidated state interface for better organization
interface SplitterState {
  containerSize: number;
  isDragging: boolean;
  isAnimating: boolean;
  isInitialized: boolean;
  sizeSetByAnimation: boolean;
  hasUserInteracted: boolean;
}

export const AppSplitter = React.memo(
  forwardRef<AppSplitterRef, IAppSplitterProps>(
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
        bustStorageOnInit = false,
        renderLeftPanel = true,
        renderRightPanel = true,
        style,
        hideSplitter: hideSplitterProp = false,
        leftPanelClassName,
        rightPanelClassName
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const startPosRef = useRef(0);
      const startSizeRef = useRef(0);
      const animationRef = useRef<number | null>(null);

      // Consolidated state management
      const [state, setState] = useState<SplitterState>({
        containerSize: 0,
        isDragging: false,
        isAnimating: false,
        isInitialized: false,
        sizeSetByAnimation: false,
        hasUserInteracted: false
      });

      // Load saved layout from localStorage
      const [savedLayout, setSavedLayout] = useLocalStorageState<number | null>(
        createAutoSaveId(autoSaveId),
        { defaultValue: null, bustStorageOnInit }
      );

      const isVertical = useMemo(() => split === 'vertical', [split]);

      // Calculate initial size based on default layout
      const calculateInitialSize = useMemoizedFn((containerSize: number): number => {
        if (containerSize === 0) return 0;

        const [leftValue, rightValue] = defaultLayout;

        if (preserveSide === 'left' && leftValue !== 'auto') {
          return sizeToPixels(leftValue, containerSize);
        } else if (preserveSide === 'right' && rightValue !== 'auto') {
          return sizeToPixels(rightValue, containerSize);
        }
        if (preserveSide === 'left') {
          return containerSize;
        }
        if (preserveSide === 'right') {
          return containerSize;
        }

        return 280; // Default fallback
      });

      // Calculate size constraints once per container size change
      const constraints = useMemo(() => {
        if (!state.containerSize) return null;

        return {
          leftMin: sizeToPixels(leftPanelMinSize, state.containerSize),
          leftMax: leftPanelMaxSize
            ? sizeToPixels(leftPanelMaxSize, state.containerSize)
            : state.containerSize,
          rightMin: sizeToPixels(rightPanelMinSize, state.containerSize),
          rightMax: rightPanelMaxSize
            ? sizeToPixels(rightPanelMaxSize, state.containerSize)
            : state.containerSize
        };
      }, [
        state.containerSize,
        leftPanelMinSize,
        rightPanelMinSize,
        leftPanelMaxSize,
        rightPanelMaxSize
      ]);

      // Apply constraints to a size value
      const applyConstraints = useMemoizedFn((size: number): number => {
        if (!constraints || !state.containerSize) return size;

        let constrainedSize = size;

        if (preserveSide === 'left') {
          constrainedSize = Math.max(constraints.leftMin, Math.min(size, constraints.leftMax));
          const rightSize = state.containerSize - constrainedSize;

          if (rightSize < constraints.rightMin) {
            constrainedSize = state.containerSize - constraints.rightMin;
          }
          if (rightSize > constraints.rightMax) {
            constrainedSize = state.containerSize - constraints.rightMax;
          }
        } else {
          constrainedSize = Math.max(constraints.rightMin, Math.min(size, constraints.rightMax));
          const leftSize = state.containerSize - constrainedSize;

          if (leftSize < constraints.leftMin) {
            constrainedSize = state.containerSize - constraints.leftMin;
          }
          if (leftSize > constraints.leftMax) {
            constrainedSize = state.containerSize - constraints.leftMax;
          }
        }

        return constrainedSize;
      });

      // Calculate panel sizes with simplified logic
      const { leftSize, rightSize } = useMemo(() => {
        const {
          containerSize,
          isInitialized,
          isAnimating,
          sizeSetByAnimation,
          isDragging,
          hasUserInteracted
        } = state;

        if (!containerSize || !isInitialized) {
          return { leftSize: 0, rightSize: 0 };
        }

        // Handle hidden panels
        if (leftHidden && !rightHidden) return { leftSize: 0, rightSize: containerSize };
        if (rightHidden && !leftHidden) return { leftSize: containerSize, rightSize: 0 };
        if (leftHidden && rightHidden) return { leftSize: 0, rightSize: 0 };

        const currentSize = savedLayout ?? 0;

        // Check if a panel is at 0px and should remain at 0px
        const isLeftPanelZero = currentSize === 0 && preserveSide === 'left';
        const isRightPanelZero = currentSize === 0 && preserveSide === 'right';

        // If a panel is at 0px, keep it at 0px and give all space to the other panel
        if (isLeftPanelZero) {
          return { leftSize: 0, rightSize: containerSize };
        }
        if (isRightPanelZero) {
          return { leftSize: containerSize, rightSize: 0 };
        }

        // During animation or when size was set by animation (and not currently dragging),
        // don't apply constraints to allow smooth animations
        const shouldApplyConstraints =
          !isAnimating && !sizeSetByAnimation && hasUserInteracted && !isDragging;

        const finalSize = shouldApplyConstraints ? applyConstraints(currentSize) : currentSize;

        if (preserveSide === 'left') {
          const left = Math.max(0, finalSize);
          const right = Math.max(0, containerSize - left);
          return { leftSize: left, rightSize: right };
        } else {
          const right = Math.max(0, finalSize);
          const left = Math.max(0, containerSize - right);
          return { leftSize: left, rightSize: right };
        }
      }, [state, savedLayout, leftHidden, rightHidden, preserveSide, applyConstraints]);

      // Determine if splitter should be hidden
      const shouldHideSplitter =
        hideSplitterProp || (leftHidden && rightHidden) || leftSize === 0 || rightSize === 0;

      const showSplitter = !leftHidden && !rightHidden;

      // Update container size and handle initialization
      const updateContainerSize = useMemoizedFn(() => {
        if (!containerRef.current) return;

        const size = isVertical
          ? containerRef.current.offsetWidth
          : containerRef.current.offsetHeight;

        setState((prev) => {
          if (prev.containerSize === size) return prev;

          const newState = { ...prev, containerSize: size };

          // Initialize if needed
          if (!prev.isInitialized && !prev.isAnimating && size > 0) {
            newState.isInitialized = true;

            // Set initial size if no saved layout exists
            if (savedLayout === null || savedLayout === undefined) {
              const initialSize = calculateInitialSize(size);
              setSavedLayout(initialSize);
            }
          }

          // Handle container resize when one panel is at 0px
          // Only adjust layout during resize if we're not currently animating
          if (
            prev.isInitialized &&
            prev.containerSize > 0 &&
            size > 0 &&
            savedLayout !== null &&
            !prev.isAnimating
          ) {
            const currentSavedSize = savedLayout;

            // If a panel is at 0px, preserve the other panel's size during resize
            if (currentSavedSize === 0) {
              if (preserveSide === 'left') {
                // Left panel is 0px, preserve right panel's size (which is the full previous container)
                setSavedLayout(0); // Keep left at 0
              } else {
                // Right panel is 0px, preserve left panel's size (which is the full previous container)
                setSavedLayout(0); // Keep right at 0
              }
            } else {
              // Check if the current layout represents a panel that should remain preserved
              const oldContainerSize = prev.containerSize;

              if (preserveSide === 'left') {
                // If left panel was at full size (right was 0), keep it at full size
                if (currentSavedSize === oldContainerSize) {
                  setSavedLayout(size);
                }
              } else {
                // If right panel was at full size (left was 0), keep it at full size
                if (currentSavedSize === oldContainerSize) {
                  setSavedLayout(size);
                }
              }
            }
          }

          return newState;
        });
      });

      // Animation function
      const animateWidth = useMemoizedFn(
        async (
          width: string | number,
          side: 'left' | 'right',
          duration: number = 250
        ): Promise<void> => {
          return new Promise((resolve) => {
            if (!state.containerSize) {
              resolve();
              return;
            }

            setState((prev) => ({ ...prev, isAnimating: true }));

            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current);
            }

            const targetPixels = sizeToPixels(width, state.containerSize);
            let targetSize: number;

            if (side === 'left') {
              targetSize =
                preserveSide === 'left' ? targetPixels : state.containerSize - targetPixels;
            } else {
              targetSize =
                preserveSide === 'right' ? targetPixels : state.containerSize - targetPixels;
            }

            const startSize = savedLayout ?? 0;
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
                setState((prev) => ({
                  ...prev,
                  isAnimating: false,
                  sizeSetByAnimation: true
                }));
                resolve();
              }
            };

            animationRef.current = requestAnimationFrame(animate);
          });
        }
      );

      // Set split sizes function
      const setSplitSizes = useMemoizedFn((sizes: [string | number, string | number]) => {
        if (!state.containerSize) return;

        const [leftValue, rightValue] = sizes;

        // Calculate both potential sizes
        const leftPixels = leftValue !== 'auto' ? sizeToPixels(leftValue, state.containerSize) : 0;
        const rightPixels =
          rightValue !== 'auto' ? sizeToPixels(rightValue, state.containerSize) : 0;

        // Determine which side to actually preserve based on which panel has content (non-zero size)
        let effectivePreserveSide = preserveSide;

        if (preserveSide === 'left' && leftValue !== 'auto') {
          // If left panel would be 0px, preserve right side instead
          if (leftPixels === 0 && rightValue !== 'auto') {
            effectivePreserveSide = 'right';
          }
        } else if (preserveSide === 'right' && rightValue !== 'auto') {
          // If right panel would be 0px, preserve left side instead
          if (rightPixels === 0 && leftValue !== 'auto') {
            effectivePreserveSide = 'left';
          }
        }

        // Apply the preservation logic with the effective side
        if (effectivePreserveSide === 'left' && leftValue !== 'auto') {
          setSavedLayout(leftPixels);
        } else if (effectivePreserveSide === 'right' && rightValue !== 'auto') {
          setSavedLayout(rightPixels);
        }

        setState((prev) => ({ ...prev, sizeSetByAnimation: false }));
      });

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

      // Mouse event handlers
      const handleMouseDown = useMemoizedFn((e: React.MouseEvent) => {
        if (!allowResize) return;

        setState((prev) => ({
          ...prev,
          isDragging: true,
          hasUserInteracted: true,
          sizeSetByAnimation: false
        }));

        startPosRef.current = isVertical ? e.clientX : e.clientY;
        startSizeRef.current = savedLayout ?? 0;
        e.preventDefault();
      });

      const handleMouseMove = useMemoizedFn((e: MouseEvent) => {
        if (!state.isDragging || !state.containerSize) return;

        const currentPos = isVertical ? e.clientX : e.clientY;
        const delta = currentPos - startPosRef.current;

        let newSize: number;

        if (preserveSide === 'left') {
          newSize = startSizeRef.current + delta;
        } else {
          newSize = startSizeRef.current - delta;
        }

        const constrainedSize = applyConstraints(newSize);
        setSavedLayout(constrainedSize);
      });

      const handleMouseUp = useMemoizedFn(() => {
        setState((prev) => ({ ...prev, isDragging: false }));
      });

      // Effects
      useEffect(() => {
        updateContainerSize();

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
        if (state.isDragging) {
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
      }, [state.isDragging, handleMouseMove, handleMouseUp, isVertical]);

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

      const sizes = useMemo<[string | number, string | number]>(
        () => [`${leftSize}px`, `${rightSize}px`],
        [leftSize, rightSize]
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
            {renderLeftPanel && leftChildren}
          </Panel>

          {showSplitter && (
            <Splitter
              onMouseDown={handleMouseDown}
              isDragging={state.isDragging}
              split={split}
              className={splitterClassName}
              disabled={!allowResize}
              hidden={shouldHideSplitter}
            />
          )}

          <Panel
            className={rightPanelClassName}
            width={isVertical ? rightSize : 'auto'}
            height={!isVertical ? rightSize : 'auto'}
            hidden={rightHidden}>
            {renderRightPanel && rightChildren}
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
  )
);

AppSplitter.displayName = 'AppSplitter';
