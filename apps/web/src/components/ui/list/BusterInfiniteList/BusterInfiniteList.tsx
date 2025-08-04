'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import { useMemoizedFn } from '@/hooks';
import type { BusterListProps } from '../BusterList';
import { BusterListHeader } from '../BusterList/BusterListHeader';
import { BusterListRowComponentSelector } from '../BusterList/BusterListRowComponentSelector';
import { getAllIdsInSection } from '../BusterList/helpers';
import { EmptyStateList } from '../EmptyStateList';

export interface BusterInfiniteListProps<T = unknown> extends BusterListProps<T> {
  onScrollEnd?: () => void;
  scrollEndThreshold?: number;
  loadingNewContent?: React.ReactNode;
}

function BusterInfiniteListComponent<T = unknown>({
  columns,
  rows,
  selectedRowKeys,
  onSelectChange,
  emptyState,
  showHeader = true,
  useRowClickSelectChange = false,
  contextMenu,
  hideLastRowBorder = true,
  showSelectAll = true,
  onScrollEnd,
  loadingNewContent,
  rowClassName = '',
  scrollEndThreshold = 48 // Default threshold of 200px
}: BusterInfiniteListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastChildIndex = useMemo(() => {
    const notHiddenRows = rows.filter((row) => !row.hidden);
    return notHiddenRows.length - 1;
  }, [rows]);

  const showEmptyState = useMemo(
    () => (!rows || rows.length === 0 || !rows.some((row) => !row.rowSection)) && !!emptyState,
    [rows, emptyState]
  );

  const onGlobalSelectChange = useMemoizedFn((v: boolean) => {
    onSelectChange?.(v ? rows.map((row) => row.id) : []);
  });

  const onSelectSectionChange = useMemoizedFn((v: boolean, id: string) => {
    if (!onSelectChange) return;
    const idsInSection = getAllIdsInSection(rows, id);

    if (v === false) {
      onSelectChange(selectedRowKeys?.filter((d) => !idsInSection.includes(d)) || []);
    } else {
      onSelectChange(selectedRowKeys?.concat(idsInSection) || []);
    }
  });

  const onSelectChangePreflight = useMemoizedFn((v: boolean, id: string) => {
    if (!onSelectChange) return;

    if (v === false) {
      onSelectChange((selectedRowKeys || []).filter((d) => d !== id));
    } else {
      onSelectChange((selectedRowKeys || []).concat(id));
    }
  });

  const globalCheckStatus = useMemo(() => {
    if (!selectedRowKeys) return 'unchecked';
    if (selectedRowKeys.length === 0) return 'unchecked';
    if (selectedRowKeys.length === rows.length) return 'checked';
    return 'indeterminate';
  }, [selectedRowKeys?.length, rows.length]);

  const itemData = useMemo(() => {
    return {
      columns,
      rows,
      selectedRowKeys,
      onSelectChange: onSelectChange ? onSelectChangePreflight : undefined,
      onSelectSectionChange: onSelectChange ? onSelectSectionChange : undefined,
      onContextMenuClick: undefined,
      hideLastRowBorder,
      useRowClickSelectChange,
      rowClassName
    };
  }, [
    columns,
    rows,
    onSelectChange,
    useRowClickSelectChange,
    hideLastRowBorder,
    onSelectSectionChange,
    contextMenu,
    selectedRowKeys
  ]);

  useEffect(() => {
    if (!onScrollEnd) return;

    // Find the first scrollable parent element
    const findScrollableParent = (element: HTMLElement | null): HTMLDivElement | null => {
      let currentElement = element;
      while (currentElement) {
        const { overflowY } = window.getComputedStyle(currentElement);
        if (overflowY === 'auto' || overflowY === 'scroll') {
          return currentElement as HTMLDivElement;
        }
        currentElement = currentElement.parentElement;
      }
      return null;
    };

    const scrollableParent = findScrollableParent(containerRef.current?.parentElement ?? null);
    if (!scrollableParent) return;

    scrollRef.current = scrollableParent;

    // Check if we've scrolled near the bottom
    const handleScroll = () => {
      if (!scrollRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom <= scrollEndThreshold) {
        onScrollEnd();
      }
    };

    scrollableParent.addEventListener('scroll', handleScroll);
    return () => scrollableParent.removeEventListener('scroll', handleScroll);
  }, [onScrollEnd, scrollEndThreshold]);

  return (
    <div ref={containerRef} className="infinite-list-container relative">
      {showHeader && !showEmptyState && (
        <BusterListHeader<T>
          columns={columns}
          onGlobalSelectChange={onSelectChange ? onGlobalSelectChange : undefined}
          globalCheckStatus={globalCheckStatus}
          rowsLength={rows.length}
          showSelectAll={showSelectAll}
          rowClassName={rowClassName}
        />
      )}

      {!showEmptyState &&
        rows
          .filter((row) => !row.hidden)
          .map((row, index) => (
            <BusterListRowComponentSelector<T>
              key={row.id}
              row={row}
              id={row.id}
              isLastChild={index === lastChildIndex}
              {...itemData}
            />
          ))}

      {showEmptyState && (
        <div className="flex h-full items-center justify-center">
          {typeof emptyState === 'string' ? <EmptyStateList text={emptyState} /> : emptyState}
        </div>
      )}

      {loadingNewContent && (
        <div className="flex h-full items-center justify-center">{loadingNewContent}</div>
      )}
    </div>
  );
}

export const BusterInfiniteList = React.memo(BusterInfiniteListComponent) as <T = unknown>(
  props: BusterInfiniteListProps<T>
) => React.ReactElement;
