'use client';

import type React from 'react';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { cn } from '@/lib/classMerge';
import { Panel } from './Panel';
import { Splitter } from './Splitter';

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

export const AppSplitterNew: React.FC<IAppSplitterNewProps> = ({
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

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
    return savedLayout || 280;
  });

  // Update container size
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const size = isVertical
          ? containerRef.current.offsetWidth
          : containerRef.current.offsetHeight;
        setContainerSize(size);

        // Initialize size on first mount
        if (!savedLayout && size > 0) {
          const initialSize = getInitialSize(size);
          setPreservedPanelSize(initialSize);
        }
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);

    return () => window.removeEventListener('resize', updateContainerSize);
  }, [isVertical, savedLayout, getInitialSize]);

  // Convert min/max sizes to pixels
  const leftMinPx = containerSize ? sizeToPixels(leftPanelMinSize, containerSize) : 0;
  const leftMaxPx =
    leftPanelMaxSize && containerSize ? sizeToPixels(leftPanelMaxSize, containerSize) : undefined;
  const rightMinPx = containerSize ? sizeToPixels(rightPanelMinSize, containerSize) : 0;
  const rightMaxPx =
    rightPanelMaxSize && containerSize ? sizeToPixels(rightPanelMaxSize, containerSize) : undefined;

  // Calculate actual panel sizes
  const calculatePanelSizes = useCallback(() => {
    if (!containerSize) return { leftSize: 0, rightSize: 0 };

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

  return (
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
};
