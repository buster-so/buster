'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  assertsSize,
  bodyDisableUserSelect,
  paneClassName,
  sashDisabledClassName,
  sashHorizontalClassName,
  sashVerticalClassName,
  splitClassName,
  splitDragClassName,
  splitHorizontalClassName,
  splitVerticalClassName
} from './base';
import Pane from './pane';
import SashContent from './SashContent';
import SplitPaneSash from './sash';
import type { IAxis, ICacheSizes, IPaneConfigs, ISplitProps } from './types';
import { cn } from '@/lib/classMerge';

const SplitPane = ({
  children,
  autoSizeId,
  sizes: propSizes,
  allowResize = true,
  split = 'vertical',
  className: wrapClassName,
  sashRender = (_, active) => <SashContent active={active} type="vscode" />,
  resizerSize = 4,
  performanceMode = false,
  onChange = () => null,
  onDragStart = () => null,
  onDragEnd = () => null,
  initialReady = true,
  ...others
}: ISplitProps) => {
  const axis = useRef<IAxis>({ x: 0, y: 0 });
  const wrapper = useRef<HTMLDivElement>(null);
  const cacheSizes = useRef<ICacheSizes>({ sizes: [], sashPosSizes: [] });
  const [wrapperRect, setWrapperRect] = useState<DOMRectReadOnly | null>(null);
  const [isDragging, setDragging] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(initialReady);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && (rect.width > 0 || rect.height > 0)) {
        setWrapperRect(rect);

        setTimeout(() => {
          setIsReady(true);
        }, 40);
      }
    });

    if (wrapper.current) {
      resizeObserver.observe(wrapper.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const { sizeName, splitPos, splitAxis } = useMemo(
    () => ({
      sizeName: split === 'vertical' ? 'width' : 'height',
      splitPos: split === 'vertical' ? 'left' : 'top',
      splitAxis: split === 'vertical' ? 'x' : 'y'
    }),
    [split]
  );

  const wrapSize: number =
    wrapperRect && typeof wrapperRect[sizeName as keyof DOMRect] === 'number'
      ? Number(wrapperRect[sizeName as keyof DOMRect])
      : 0;

  // Get limit sizes via children
  const paneLimitSizes = useMemo(
    () =>
      children.map((childNode) => {
        const limits = [0, Number.POSITIVE_INFINITY];
        if (childNode.type === Pane) {
          const { minSize, maxSize } = childNode.props as IPaneConfigs;
          limits[0] = assertsSize(minSize, wrapSize, 0);
          limits[1] = assertsSize(maxSize, wrapSize);
        }
        return limits;
      }),
    [children, wrapSize]
  );

  const sizes = useMemo(() => {
    let count = 0;
    let curSum = 0;
    const res = children.map((_, index) => {
      const size = assertsSize(propSizes[index], wrapSize);
      if (size === Number.POSITIVE_INFINITY) {
        count++;
      } else {
        curSum += size;
      }
      return size;
    });

    // resize or illegal size input,recalculate pane sizes
    if (curSum > wrapSize || (!count && curSum < wrapSize)) {
      const cacheNum = (curSum - wrapSize) / curSum;
      return res.map((size) => {
        return size === Number.POSITIVE_INFINITY ? 0 : size - size * cacheNum;
      });
    }

    if (count > 0) {
      const average = (wrapSize - curSum) / count;
      return res.map((size) => {
        return size === Number.POSITIVE_INFINITY ? average : size;
      });
    }

    return res;
  }, [propSizes, children.length, wrapSize]);

  const sashPosSizes = useMemo(
    () =>
      sizes.reduce(
        (a, b) => {
          const newSize = a[a.length - 1] + b;
          a.push(newSize);
          return a;
        },
        [0]
      ),
    [sizes] //THIS WAS MODIFIED FROM THE ORIGINAL
  );

  const dragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      document?.body?.classList?.add(bodyDisableUserSelect);
      axis.current = { x: e.pageX, y: e.pageY };
      cacheSizes.current = { sizes, sashPosSizes };
      setDragging(true);
      onDragStart(e.nativeEvent);
    },
    [onDragStart, sizes, sashPosSizes]
  );

  const dragEnd = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      document?.body?.classList?.remove(bodyDisableUserSelect);
      axis.current = { x: e.pageX, y: e.pageY };
      cacheSizes.current = { sizes, sashPosSizes };
      setDragging(false);
      onDragEnd(e.nativeEvent);
    },
    [onDragEnd, sizes, sashPosSizes]
  );

  const onDragging = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, i: number) => {
      const curAxis = { x: e.pageX, y: e.pageY };
      let distanceX = curAxis[splitAxis as keyof IAxis] - axis.current[splitAxis as keyof IAxis];

      const leftBorder = -Math.min(
        sizes[i] - paneLimitSizes[i][0],
        paneLimitSizes[i + 1][1] - sizes[i + 1]
      );
      const rightBorder = Math.min(
        sizes[i + 1] - paneLimitSizes[i + 1][0],
        paneLimitSizes[i][1] - sizes[i]
      );

      if (distanceX < leftBorder) {
        distanceX = leftBorder;
      }
      if (distanceX > rightBorder) {
        distanceX = rightBorder;
      }

      const nextSizes = sizes.slice();
      nextSizes[i] += distanceX;
      nextSizes[i + 1] -= distanceX;

      onChange(nextSizes);
    },
    [paneLimitSizes, onChange]
  );

  const paneFollow = !(performanceMode && isDragging);
  const paneSizes = paneFollow ? sizes : cacheSizes.current.sizes;
  const panePoses = paneFollow ? sashPosSizes : cacheSizes.current.sashPosSizes;

  return (
    <div
      className={cn(
        splitClassName,
        split === 'vertical' && splitVerticalClassName,
        split === 'horizontal' && splitHorizontalClassName,
        isDragging && splitDragClassName,
        wrapClassName
      )}
      ref={wrapper}
      {...others}>
      {isReady ? (
        <>
          {children.map((childNode, childIndex) => {
            const isPane = childNode.type === Pane;
            const paneProps = isPane ? childNode.props : {};

            const style = {
              ...paneProps.style,
              [sizeName]: paneSizes[childIndex],
              [splitPos]: panePoses[childIndex]
            };

            return (
              <Pane
                key={childIndex.toString()}
                className={cn(paneClassName, paneProps.className)}
                style={style}>
                {isPane ? paneProps.children : childNode}
              </Pane>
            );
          })}
          {sashPosSizes.slice(1, -1).map((posSize, index) => (
            <SplitPaneSash
              key={index.toString()}
              className={cn(
                !allowResize && sashDisabledClassName,
                split === 'vertical' ? sashVerticalClassName : sashHorizontalClassName
              )}
              style={{
                [sizeName]: resizerSize,
                [splitPos]: posSize - resizerSize / 2
              }}
              render={sashRender.bind(null, index)}
              onDragStart={dragStart}
              onDragging={(e) => onDragging(e, index)}
              onDragEnd={dragEnd}
            />
          ))}
        </>
      ) : null}
    </div>
  );
};

export default React.memo(SplitPane);
