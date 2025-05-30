'use client';

import Cookies from 'js-cookie';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { useMemoizedFn, useSize } from '@/hooks';
import { cn } from '@/lib/classMerge';
import {
  convertPxToPercentage,
  createAutoSaveId,
  easeInOutCubic,
  getCurrentSizePercentage,
  parseWidthValue,
  setAppSplitterCookie,
  getCurrentSizesInPixels
} from './helper';
import SplitPane, { Pane } from './SplitPane';
import './splitterStyles.css';
import { timeout } from '@/lib';
import { AppSplitterProvider } from './AppSplitterProvider';

// First, define the ref type
export interface AppSplitterRef {
  setSplitSizes: (newSizes: (number | string)[]) => void;
  animateWidth: (width: string, side: 'left' | 'right', duration?: number) => Promise<void>;
  isSideClosed: (side: 'left' | 'right') => boolean;
  sizes: (number | string)[];
}

export const AppSplitter = React.memo(
  forwardRef<
    AppSplitterRef,
    {
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
      preserveSide: 'left' | 'right' | null;
      rightHidden?: boolean;
      leftHidden?: boolean;
      style?: React.CSSProperties;
      hideSplitter?: boolean;
      initialReady?: boolean;
    }
  >(
    (
      {
        style,
        leftChildren,
        preserveSide,
        rightChildren,
        autoSaveId,
        defaultLayout,
        leftPanelMinSize,
        rightPanelMinSize,
        split = 'vertical',
        leftPanelMaxSize,
        rightPanelMaxSize,
        allowResize,
        className = '',
        splitterClassName = '',
        leftHidden,
        rightHidden,
        hideSplitter,
        initialReady = true
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const [sizes, setSizes] = useState<(number | string)[]>(defaultLayout);
      const hasHidden = useMemo(() => leftHidden || rightHidden, [leftHidden, rightHidden]);
      const _allowResize = useMemo(
        () => (hasHidden ? false : allowResize),
        [hasHidden, allowResize]
      );

      const _sizes = useMemo(() => {
        return hasHidden ? (leftHidden ? ['0px', 'auto'] : ['auto', '0px']) : sizes;
      }, [hasHidden, leftHidden, sizes]);

      const memoizedLeftPaneStyle = useMemo(() => {
        const isHidden = leftHidden;
        const isEffectivelyHidden = _sizes[0] === '0px' || _sizes[0] === '0%';
        return {
          display: isHidden ? 'none' : undefined,
          overflow: isEffectivelyHidden ? 'hidden' : undefined
        };
      }, [leftHidden, _sizes[0]]);

      const memoizedRightPaneStyle = useMemo(() => {
        return {
          display: rightHidden ? 'none' : undefined
        };
      }, [rightHidden]);

      const isSideClosed = useMemoizedFn((side: 'left' | 'right') => {
        if (side === 'left') {
          return _sizes[0] === '0px' || _sizes[0] === '0%' || _sizes[0] === 0;
        }
        return _sizes[1] === '0px' || _sizes[1] === '0%' || _sizes[1] === 0;
      });

      const hideSash = useMemo(() => {
        return hideSplitter ?? (leftHidden || rightHidden);
      }, [hideSplitter, leftHidden, rightHidden]);

      const sashRender = useMemoizedFn((_: number, active: boolean) => (
        <AppSplitterSash
          hideSplitter={hideSash}
          active={active}
          splitterClassName={splitterClassName}
          splitDirection={split}
        />
      ));

      const onChangePanels = useMemoizedFn((sizes: number[]) => {
        //    if (!isDragging) return;
        setSizes(sizes);
        const key = createAutoSaveId(autoSaveId);
        const sizesString = preserveSide === 'left' ? [sizes[0], 'auto'] : ['auto', sizes[1]];
        Cookies.set(key, JSON.stringify(sizesString), { expires: 365 });
      });

      const onPreserveSide = useMemoizedFn(() => {
        const [left, right] = sizes;
        if (preserveSide === 'left') {
          setSizes([left, 'auto']);
        } else if (preserveSide === 'right') {
          setSizes(['auto', right]);
        }
      });

      const setSplitSizes = useMemoizedFn((newSizes: (number | string)[]) => {
        // Convert all sizes to percentage strings
        const percentageSizes = newSizes.map((size) =>
          typeof size === 'number' ? `${size * 100}%` : size
        );

        setSizes(percentageSizes);
        if (preserveSide) {
          const key = createAutoSaveId(autoSaveId);
          const sizesString =
            preserveSide === 'left' ? [percentageSizes[0], 'auto'] : ['auto', percentageSizes[1]];
          Cookies.set(key, JSON.stringify(sizesString), { expires: 365 });
          setAppSplitterCookie(key, sizesString);
        }
      });

      const animateWidth = useMemoizedFn(
        async (width: string | number, side: 'left' | 'right', duration: number = 0.25) => {
          const { value: targetValue, unit: targetUnit } =
            typeof width === 'number' ? { value: width, unit: 'px' } : parseWidthValue(width);
          const container = containerRef.current;
          if (!container) return;

          const containerWidth = container.getBoundingClientRect().width;
          let targetPercentage: number;

          // If the container width is 0, wait for 10ms and try again
          if (containerWidth === 0) {
            await timeout(25);
            return animateWidth(width, side, duration);
          }

          // Convert target width to percentage
          if (targetUnit === 'px') {
            targetPercentage = convertPxToPercentage(targetValue, containerWidth);
          } else {
            targetPercentage = targetValue;
          }

          const bothSizesAreNumber = typeof _sizes[0] === 'number' && typeof _sizes[1] === 'number';
          const leftPanelSize = bothSizesAreNumber
            ? `${(Number(_sizes[0]) / (Number(_sizes[0]) + Number(_sizes[1]))) * 100}%`
            : _sizes[0];
          const rightPanelSize = bothSizesAreNumber
            ? `${(Number(_sizes[1]) / (Number(_sizes[0]) + Number(_sizes[1]))) * 100}%`
            : _sizes[1];
          const currentSize = side === 'left' ? leftPanelSize : rightPanelSize;
          const otherSize = side === 'left' ? rightPanelSize : leftPanelSize;

          // Calculate current percentage considering 'auto' cases
          const currentSizeNumber = getCurrentSizePercentage(currentSize, otherSize, container);

          if (
            currentSizeNumber === Number.POSITIVE_INFINITY ||
            currentSizeNumber === Number.NEGATIVE_INFINITY ||
            targetPercentage === Number.POSITIVE_INFINITY ||
            targetPercentage === Number.NEGATIVE_INFINITY
          ) {
            return;
          }

          await new Promise((resolve) => {
            const startTime = performance.now();
            const endTime = startTime + duration * 1000;

            const animate = (currentTime: number) => {
              const elapsedTime = currentTime - startTime;
              const progress = Math.min(elapsedTime / (duration * 1000), 1);

              const easedProgress = easeInOutCubic(progress);
              const newSizeNumber =
                currentSizeNumber + (targetPercentage - currentSizeNumber) * easedProgress;

              const newSize = `${newSizeNumber}%`;
              const otherSize = `${100 - newSizeNumber}%`;

              const newSizes = side === 'left' ? [newSize, otherSize] : [otherSize, newSize];

              setSplitSizes(newSizes);

              if (currentTime < endTime) {
                requestAnimationFrame(animate);
              } else {
                resolve(true);
              }
            };

            requestAnimationFrame(animate);
          });
        }
      );

      const getSizesInPixels = useMemoizedFn((): [number, number] => {
        const container = containerRef.current;
        if (!container) return [0, 0];
        return getCurrentSizesInPixels(container, _sizes as [string, string]);
      });

      const imperativeHandleMethods = useMemo(() => {
        return () => ({
          setSplitSizes,
          animateWidth,
          isSideClosed,
          sizes: _sizes
        });
      }, [setSplitSizes, animateWidth, isSideClosed, _sizes]);

      // Add useImperativeHandle to expose the function
      useImperativeHandle(ref, imperativeHandleMethods);

      const size = useSize(containerRef);

      useEffect(() => {
        if (preserveSide) {
          window.addEventListener('resize', onPreserveSide);
          return () => {
            window.removeEventListener('resize', onPreserveSide);
          };
        }
      }, [preserveSide]);

      return (
        <div className={cn('flex h-full w-full flex-col', className)} ref={containerRef}>
          <AppSplitterProvider
            animateWidth={animateWidth}
            setSplitSizes={setSplitSizes}
            isSideClosed={isSideClosed}
            getSizesInPixels={getSizesInPixels}
            sizes={_sizes as [string, string]}>
            <SplitPane
              autoSizeId={autoSaveId}
              initialReady={initialReady}
              split={split}
              sizes={_sizes}
              style={style}
              allowResize={_allowResize}
              onChange={onChangePanels}
              // onDragStart={onDragStart}
              // onDragEnd={onDragEnd}
              resizerSize={3}
              sashRender={sashRender}>
              <Pane
                style={memoizedLeftPaneStyle}
                className={'left-pane flex h-full flex-col'}
                minSize={leftPanelMinSize}
                maxSize={leftPanelMaxSize}>
                {leftHidden || size?.width === 0 || size?.width === undefined ? null : leftChildren}
              </Pane>
              <Pane
                className="right-pane flex h-full flex-col"
                style={memoizedRightPaneStyle}
                minSize={rightPanelMinSize}
                maxSize={rightPanelMaxSize}>
                {rightHidden || size?.width === 0 || size?.width === undefined
                  ? null
                  : rightChildren}
              </Pane>
            </SplitPane>
          </AppSplitterProvider>
        </div>
      );
    }
  )
);
AppSplitter.displayName = 'AppSplitter';

const AppSplitterSash: React.FC<{
  active: boolean;
  splitterClassName?: string;
  hideSplitter?: boolean;
  splitDirection?: 'vertical' | 'horizontal';
}> = React.memo(
  ({ active, splitterClassName = '', hideSplitter = false, splitDirection = 'vertical' }) => {
    return (
      <div
        className={cn(
          splitterClassName,
          //  styles.splitter,
          'bg-primary left-[1px]',
          'absolute transition',
          `cursor-${splitDirection}-resize`,
          splitDirection === 'vertical' ? 'h-full w-[0.5px]' : 'h-[0.5px] w-full',
          active && 'bg-primary',
          !active && 'bg-border',
          hideSplitter && 'bg-transparent',
          hideSplitter && active && 'bg-border'
        )}
      />
    );
  }
);
AppSplitterSash.displayName = 'AppSplitterSash';
