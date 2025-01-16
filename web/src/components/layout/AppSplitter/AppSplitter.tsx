'use client';

import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import SplitPane, { Pane } from './SplitPane';
import { createAutoSaveId } from './helper';
import Cookies from 'js-cookie';
import { createStyles } from 'antd-style';

// First, define the ref type
export interface AppSplitterRef {
  setSplitSizes: (newSizes: (number | string)[]) => void;
}

export const AppSplitter = forwardRef<
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
      className,
      splitterClassName,
      leftHidden,
      rightHidden,
      hideSplitter
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const [sizes, setSizes] = useState<(number | string)[]>(defaultLayout);
    const conatinerRef = React.useRef<HTMLDivElement>(null);
    const hasHidden = useMemo(() => leftHidden || rightHidden, [leftHidden, rightHidden]);
    const _allowResize = useMemo(() => (hasHidden ? false : allowResize), [hasHidden, allowResize]);

    const _sizes = useMemo(
      () => (hasHidden ? (leftHidden ? ['0px', 'auto'] : ['auto', '0px']) : sizes),
      [hasHidden, leftHidden, sizes]
    );

    const memoizedLeftPaneStyle = useMemo(() => {
      return {
        display: leftHidden ? 'none' : undefined
      };
    }, [leftHidden]);

    const memoizedRightPaneStyle = useMemo(() => {
      return {
        display: rightHidden ? 'none' : undefined
      };
    }, [rightHidden]);

    const sashRender = useMemoizedFn((_: number, active: boolean) => (
      <AppSplitterSash
        hideSplitter={hideSplitter}
        active={active}
        splitterClassName={splitterClassName}
        splitDirection={split}
      />
    ));

    const onDragEnd = useMemoizedFn(() => {
      setIsDragging(false);
    });

    const onDragStart = useMemoizedFn(() => {
      setIsDragging(true);
    });

    const onChangePanels = useMemoizedFn((sizes: number[]) => {
      if (!isDragging) return;
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

    useEffect(() => {
      if (preserveSide && !hideSplitter && split === 'vertical') {
        window.addEventListener('resize', onPreserveSide);
        return () => {
          window.removeEventListener('resize', onPreserveSide);
        };
      }
    }, [preserveSide]);

    // Add useImperativeHandle to expose the function
    useImperativeHandle(ref, () => ({
      setSplitSizes: (newSizes: (number | string)[]) => {
        setSizes(newSizes);
        if (preserveSide) {
          const key = createAutoSaveId(autoSaveId);
          const sizesString =
            preserveSide === 'left' ? [newSizes[0], 'auto'] : ['auto', newSizes[1]];
          Cookies.set(key, JSON.stringify(sizesString), { expires: 365 });
        }
      }
    }));

    return (
      <div ref={conatinerRef} className="h-full w-full">
        <SplitPane
          split={split}
          className={`${className}`}
          sizes={_sizes}
          style={style}
          allowResize={_allowResize}
          onChange={onChangePanels}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          resizerSize={3}
          sashRender={sashRender}>
          <Pane
            style={memoizedLeftPaneStyle}
            className="flex h-full flex-col"
            minSize={leftPanelMinSize}
            maxSize={leftPanelMaxSize}>
            {leftHidden ? null : leftChildren}
          </Pane>
          <Pane
            className="flex h-full flex-col"
            style={memoizedRightPaneStyle}
            minSize={rightPanelMinSize}
            maxSize={rightPanelMaxSize}>
            {rightHidden ? null : rightChildren}
          </Pane>
        </SplitPane>
      </div>
    );
  }
);
AppSplitter.displayName = 'AppSplitter';

const AppSplitterSash: React.FC<{
  active: boolean;
  splitterClassName?: string;
  hideSplitter?: boolean;
  splitDirection?: 'vertical' | 'horizontal';
}> = React.memo(
  ({ active, splitterClassName = '', hideSplitter = false, splitDirection = 'vertical' }) => {
    const { styles, cx } = useStyles();

    return (
      <div
        className={cx(
          splitterClassName,
          styles.splitter,
          'absolute transition',
          `cursor-${splitDirection}-resize`,
          splitDirection === 'vertical' ? 'h-full w-[0.5px]' : 'h-[0.5px] w-full',
          hideSplitter && 'hide',
          active && 'active',
          !active && 'inactive'
        )}
      />
    );
  }
);
AppSplitterSash.displayName = 'AppSplitterSash';

const useStyles = createStyles(({ css, token }) => ({
  splitter: css`
    background: ${token.colorPrimary};
    left: 1px;

    &.hide {
      background: transparent;

      &.active {
        background: ${token.colorBorder};
      }
    }

    &:not(.hide) {
      &.active {
        background: ${token.colorPrimary};
      }

      &.inactive {
        background: ${token.colorBorder};
      }
    }
  `
}));
