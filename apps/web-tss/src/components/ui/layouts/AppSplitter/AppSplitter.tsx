'use client';

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useCookieState } from '@/hooks/useCookieState';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/classMerge';
import { AppSplitterProvider } from './AppSplitterProvider';
import { createAutoSaveId, easeInOutCubic, sizeToPixels } from './helpers';
import { Panel } from './Panel';
import { Splitter } from './Splitter';

// ================================
// INTERFACES AND TYPES
// ================================

/**
 * Props for the AppSplitter component
 */
interface IAppSplitterProps {
  /** Content to display in the left panel */
  leftChildren: React.ReactNode;

  /** Content to display in the right panel */
  rightChildren: React.ReactNode;

  /** Unique identifier for auto-saving layout to cookie */
  autoSaveId: string;

  /**
   * Default layout configuration as [left, right] sizes
   * Can be numbers (pixels), percentages (strings like "50%"), or "auto"
   */
  defaultLayout: (string | number)[];

  /**
   * Initial layout configuration as [left, right] sizes. If provided,
   * this will be converted to the preserved side's pixel value and used
   * as the cookie initialValue (subject to bust logic). If not provided,
   * we fallback to the cookie's parsed value, and ultimately to defaultLayout.
   */
  initialLayout?: (string | number)[];

  /**
   * Minimum size for the left panel
   * Can be a number (pixels) or string (percentage)
   * @default 0
   */
  leftPanelMinSize?: number | string;

  /**
   * Minimum size for the right panel
   * Can be a number (pixels) or string (percentage)
   * @default 0
   */
  rightPanelMinSize?: number | string;

  /**
   * Maximum size for the left panel
   * Can be a number (pixels) or string (percentage)
   * If not specified, defaults to container size
   */
  leftPanelMaxSize?: number | string;

  /**
   * Maximum size for the right panel
   * Can be a number (pixels) or string (percentage)
   * If not specified, defaults to container size
   */
  rightPanelMaxSize?: number | string;

  /** Additional CSS classes for the container */
  className?: string;

  /**
   * Whether the splitter can be resized by dragging
   * @default true
   */
  allowResize?: boolean;

  /**
   * Split direction
   * @default 'vertical'
   */
  split?: 'vertical' | 'horizontal';

  /** Additional CSS classes for the splitter element */
  splitterClassName?: string;

  /**
   * Which side to preserve when resizing
   * 'left' - left panel maintains its size, right panel adjusts
   * 'right' - right panel maintains its size, left panel adjusts
   */
  preserveSide: 'left' | 'right';

  /**
   * Whether to hide the right panel completely
   * @default false
   */
  rightHidden?: boolean;

  /**
   * Whether to hide the left panel completely
   * @default false
   */
  leftHidden?: boolean;

  /** Inline styles for the container */
  style?: React.CSSProperties;

  /**
   * Whether to hide the splitter handle
   * @default false
   */
  hideSplitter?: boolean;

  /** Additional CSS classes for the left panel */
  leftPanelClassName?: string;

  /** Additional CSS classes for the right panel */
  rightPanelClassName?: string;

  /**
   * Whether to clear saved layout from storage on initialization
   * Can be a boolean or a function that returns a boolean based on preserved side value and container width
   */
  bustStorageOnInit?: boolean | ((preservedSideValue: number | null, refSize: number) => boolean);

  /**
   * Whether to render the left panel content
   * @default true
   */
  renderLeftPanel?: boolean;

  /**
   * Whether to render the right panel content
   * @default true
   */
  renderRightPanel?: boolean;
}

/**
 * Ref interface for controlling the AppSplitter imperatively
 */
export interface AppSplitterRef {
  /**
   * Animate a panel to a specific width
   * @param width - Target width (pixels or percentage)
   * @param side - Which side to animate
   * @param duration - Animation duration in milliseconds
   */
  animateWidth: (
    width: string | number,
    side: 'left' | 'right',
    duration?: number
  ) => Promise<void>;

  /**
   * Set the split sizes programmatically
   * @param sizes - [left, right] sizes as pixels or percentages
   */
  setSplitSizes: (sizes: [string | number, string | number]) => void;

  /**
   * Check if a side is closed (hidden or 0px)
   * @param side - Which side to check
   */
  isSideClosed: (side: 'left' | 'right') => boolean;

  /**
   * Get current sizes in pixels
   * @returns [leftSize, rightSize] in pixels
   */
  getSizesInPixels: () => [number, number];
}

/**
 * Internal state interface for the splitter
 */
interface SplitterState {
  /** Current container size in pixels */
  containerSize: number;
  /** Whether the user is currently dragging the splitter */
  isDragging: boolean;
  /** Whether an animation is currently in progress */
  isAnimating: boolean;
  /** Whether the current size was set by an animation */
  sizeSetByAnimation: boolean;
  /** Whether the user has interacted with the splitter */
  hasUserInteracted: boolean;
}

const AppSplitterContext = createContext<{
  splitterAutoSaveId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}>({
  splitterAutoSaveId: '',
  containerRef: { current: null },
});

const useAppSplitterContext = () => {
  return useContext(AppSplitterContext);
};

// ================================
// MAIN COMPONENT
// ================================

/**
 * AppSplitter - A resizable split panel component with cookie persistence
 *
 * Features:
 * - Horizontal or vertical splitting
 * - Drag to resize with constraints
 * - Auto-save layout to cookie
 * - Smooth animations
 * - Responsive container resizing
 * - Panel hiding/showing
 * - Imperative API via ref
 */
const AppSplitterWrapper = forwardRef<AppSplitterRef, IAppSplitterProps>(
  ({ autoSaveId, style, className, split = 'vertical', ...props }, componentRef) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isVertical = split === 'vertical';
    const [mounted, setMounted] = useState(!props.bustStorageOnInit);
    const splitterAutoSaveId = createAutoSaveId(autoSaveId);

    const { splitterAutoSaveId: parentSplitterAutoSaveId } = useAppSplitterContext();

    useMount(async () => {
      // we need to wait for the parent to be mounted and the container to be sized
      if (parentSplitterAutoSaveId || !containerRef.current?.offsetWidth) {
        requestAnimationFrame(() => {
          setMounted(true);
        });
      } else {
        setMounted(true);
      }
    });

    return (
      <AppSplitterContext.Provider value={{ splitterAutoSaveId, containerRef }}>
        <div
          ref={containerRef}
          id={splitterAutoSaveId}
          className={cn('flex h-full w-full', isVertical ? 'flex-row' : 'flex-col', className)}
          style={style}
        >
          {mounted && (
            <AppSplitterBase
              {...props}
              ref={componentRef}
              isVertical={isVertical}
              containerRef={containerRef}
              splitterAutoSaveId={splitterAutoSaveId}
              split={split}
            />
          )}
        </div>
      </AppSplitterContext.Provider>
    );
  }
);

AppSplitterWrapper.displayName = 'AppSplitterWrapper';

// ================================
// CORE IMPLEMENTATION
// ================================

const AppSplitterBase = forwardRef<
  AppSplitterRef,
  Omit<IAppSplitterProps, 'autoSaveId' | 'style' | 'className'> & {
    isVertical: boolean;
    containerRef: React.RefObject<HTMLDivElement | null>;
    splitterAutoSaveId: string;
  }
>(
  (
    {
      leftChildren,
      rightChildren,
      defaultLayout,
      initialLayout,
      leftPanelMinSize = 0,
      rightPanelMinSize = 0,
      leftPanelMaxSize,
      rightPanelMaxSize,
      allowResize = true,
      splitterClassName,
      preserveSide,
      rightHidden = false,
      leftHidden = false,
      renderLeftPanel = true,
      renderRightPanel = true,
      hideSplitter: hideSplitterProp = false,
      leftPanelClassName,
      rightPanelClassName,
      isVertical,
      splitterAutoSaveId,
      containerRef,
      bustStorageOnInit,
      split = 'vertical',
    },
    ref
  ) => {
    // ================================
    // REFS AND STATE
    // ================================

    const startPosRef = useRef(0);
    const startSizeRef = useRef(0);
    const animationRef = useRef<number | null>(null);

    // Consolidated state management
    const [state, setState] = useState<SplitterState>({
      containerSize:
        split === 'vertical'
          ? (containerRef.current?.offsetWidth ?? 0)
          : (containerRef.current?.offsetHeight ?? 0),
      isDragging: false,
      isAnimating: false,
      sizeSetByAnimation: false,
      hasUserInteracted: false,
    });

    // ================================
    // STORAGE MANAGEMENT
    // ================================

    const bustStorageOnInitSplitter = (preservedSideValue: number | null) => {
      const refSize =
        split === 'vertical'
          ? containerRef.current?.offsetWidth
          : containerRef.current?.offsetHeight;
      // Don't bust storage if container hasn't been sized yet
      if (!refSize || refSize === 0) {
        return false;
      }

      return typeof bustStorageOnInit === 'function'
        ? bustStorageOnInit(preservedSideValue, refSize)
        : !!bustStorageOnInit;
    };

    const defaultValue = () => {
      const [leftValue, rightValue] = defaultLayout;
      const containerSize =
        split === 'vertical'
          ? (containerRef.current?.offsetWidth ?? 0)
          : (containerRef.current?.offsetHeight ?? 0);

      if (preserveSide === 'left' && leftValue === 'auto') {
        return containerSize;
      }
      if (preserveSide === 'right' && rightValue === 'auto') {
        return containerSize;
      }
      const preserveValue = preserveSide === 'left' ? leftValue : rightValue;
      const result = sizeToPixels(preserveValue, containerSize);
      return result;
    };

    const initialValueFromProp = (() => {
      if (!initialLayout) return undefined;
      const [leftValue, rightValue] = initialLayout;
      const containerSize =
        split === 'vertical'
          ? (containerRef.current?.offsetWidth ?? 0)
          : (containerRef.current?.offsetHeight ?? 0);

      if (preserveSide === 'left') {
        if (leftValue === 'auto') return containerSize;
        return sizeToPixels(leftValue, containerSize);
      }
      if (rightValue === 'auto') return containerSize;
      return sizeToPixels(rightValue, containerSize);
    })();

    // Load saved layout from cookie
    const [savedLayout, setSavedLayout] = useCookieState<number>(splitterAutoSaveId, {
      defaultValue,
      bustStorageOnInit: (layout) => bustStorageOnInitSplitter(layout ?? null),
      initialValue: initialValueFromProp,
    });

    // ================================
    // SIZE CALCULATION LOGIC
    // ================================

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
          : state.containerSize,
      };
    }, [
      state.containerSize,
      leftPanelMinSize,
      rightPanelMinSize,
      leftPanelMaxSize,
      rightPanelMaxSize,
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
      const { containerSize, isAnimating, sizeSetByAnimation, isDragging, hasUserInteracted } =
        state;

      if (!containerSize) {
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

    // ================================
    // CONTAINER RESIZE HANDLING
    // ================================

    // Update container size and handle initialization
    const updateContainerSize = useMemoizedFn(() => {
      if (!containerRef.current) return;

      const size = isVertical
        ? containerRef.current.offsetWidth
        : containerRef.current.offsetHeight;

      setState((prev) => {
        if (prev.containerSize === size) return prev;

        const newState = { ...prev, containerSize: size };

        // Initialize if needed - only when container has actual size
        if (!prev.isAnimating && size > 0) {
          // Set initial size if no saved layout exists
          if (savedLayout === null || savedLayout === undefined) {
            const initialSize = calculateInitialSize(size);
            setSavedLayout(initialSize);
          }
        }

        // Handle container resize when one panel is at 0px
        // Only adjust layout during resize if we're not currently animating
        if (prev.containerSize > 0 && size > 0 && savedLayout != null && !prev.isAnimating) {
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

    // ================================
    // ANIMATION LOGIC
    // ================================

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
                sizeSetByAnimation: true,
              }));
              resolve();
            }
          };

          animationRef.current = requestAnimationFrame(animate);
        });
      }
    );

    // ================================
    // IMPERATIVE API METHODS
    // ================================

    // Set split sizes function
    const setSplitSizes = useMemoizedFn((sizes: [string | number, string | number]) => {
      if (!state.containerSize) return;

      const [leftValue, rightValue] = sizes;

      // Calculate both potential sizes
      const leftPixels = leftValue !== 'auto' ? sizeToPixels(leftValue, state.containerSize) : 0;
      const rightPixels = rightValue !== 'auto' ? sizeToPixels(rightValue, state.containerSize) : 0;

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

    // ================================
    // MOUSE EVENT HANDLERS
    // ================================

    const handleMouseDown = useMemoizedFn((e: React.MouseEvent) => {
      if (!allowResize) return;

      setState((prev) => ({
        ...prev,
        isDragging: true,
        hasUserInteracted: true,
        sizeSetByAnimation: false,
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

    // ================================
    // EFFECTS AND LIFECYCLE
    // ================================

    // Container resize monitoring
    useEffect(() => {
      updateContainerSize();

      // If container is still 0 after layout, try again with animation frame
      if (containerRef.current?.offsetWidth === 0 || containerRef.current?.offsetHeight === 0) {
        requestAnimationFrame(updateContainerSize);
      }

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

    // Mouse event handling during drag
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

    // Expose imperative API via ref
    useImperativeHandle(
      ref,
      () => ({
        animateWidth,
        setSplitSizes,
        isSideClosed,
        getSizesInPixels,
      }),
      [animateWidth, setSplitSizes, isSideClosed, getSizesInPixels]
    );

    // ================================
    // RENDER LOGIC
    // ================================

    // Determine if splitter should be hidden
    const shouldHideSplitter =
      hideSplitterProp || (leftHidden && rightHidden) || leftSize === 0 || rightSize === 0;

    const showSplitter = !leftHidden && !rightHidden;

    const sizes = useMemo<[string | number, string | number]>(
      () => [`${leftSize}px`, `${rightSize}px`],
      [leftSize, rightSize]
    );

    const content = (
      <>
        <Panel
          className={leftPanelClassName}
          width={isVertical ? leftSize : 'auto'}
          height={!isVertical ? leftSize : 'auto'}
          hidden={leftHidden}
        >
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
          hidden={rightHidden}
        >
          {renderRightPanel && rightChildren}
        </Panel>
      </>
    );

    return (
      <AppSplitterProvider
        animateWidth={animateWidth}
        setSplitSizes={setSplitSizes}
        isSideClosed={isSideClosed}
        getSizesInPixels={getSizesInPixels}
        sizes={sizes}
      >
        {content}
      </AppSplitterProvider>
    );
  }
);

export const AppSplitter = React.memo(AppSplitterWrapper);

AppSplitter.displayName = 'AppSplitter';
AppSplitterBase.displayName = 'AppSplitterBase';