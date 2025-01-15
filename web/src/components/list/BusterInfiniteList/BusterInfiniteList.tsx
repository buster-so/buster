import React from 'react';
import { useMemoizedFn } from 'ahooks';
import { BusterListProps } from '../BusterList';
import { getAllIdsInSection } from '../BusterList/helpers';
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { BusterListHeader } from '../BusterList/BusterListHeader';
import { BusterListRowComponentSelector } from '../BusterList/BusterListRowComponentSelector';

export interface BusterInfiniteListProps extends BusterListProps {
  onScrollEnd?: () => void;
  scrollEndThreshold?: number;
  loadingNewContent?: React.ReactNode;
}

export const BusterInfiniteList: React.FC<BusterInfiniteListProps> = ({
  columns,
  rows,
  selectedRowKeys,
  onSelectChange,
  emptyState,
  showHeader = true,
  contextMenu,
  columnRowVariant = 'containerized',
  showSelectAll = true,
  onScrollEnd,
  loadingNewContent,
  scrollEndThreshold = 200 // Default threshold of 200px
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!onSelectChange || !selectedRowKeys) return;
    if (v === false) {
      onSelectChange(selectedRowKeys?.filter((d) => d !== id));
    } else {
      onSelectChange(selectedRowKeys?.concat(id) || []);
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
      columnRowVariant
    };
  }, [
    columns,
    rows,
    onSelectChange,
    columnRowVariant,
    onSelectSectionChange,
    contextMenu,
    selectedRowKeys
  ]);

  // Add scroll handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !onScrollEnd) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceToBottom <= scrollEndThreshold) {
      onScrollEnd();
    }
  }, [onScrollEnd, scrollEndThreshold]);

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onScrollEnd) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, onScrollEnd]);

  return (
    <div
      className="infinite-list-container relative flex h-full w-full flex-col overflow-auto"
      ref={containerRef}>
      {showHeader && !showEmptyState && (
        <BusterListHeader
          columns={columns}
          onGlobalSelectChange={onSelectChange ? onGlobalSelectChange : undefined}
          globalCheckStatus={globalCheckStatus}
          rowsLength={rows.length}
          showSelectAll={showSelectAll}
        />
      )}

      {!showEmptyState && (
        <div className="relative h-full w-full">
          {rows.map((row) => (
            <BusterListRowComponentSelector key={row.id} row={row} id={row.id} {...itemData} />
          ))}
        </div>
      )}

      {showEmptyState && (
        <div className="flex h-full items-center justify-center">{emptyState}</div>
      )}

      {loadingNewContent && (
        <div className="flex h-full items-center justify-center">{loadingNewContent}</div>
      )}
    </div>
  );
};
