'use client';

import React, { useMemo, useRef } from 'react';
import { VList } from 'virtua';
import { useMemoizedFn } from '@/hooks';
import { ContextMenu, type ContextMenuProps } from '../../context-menu/ContextMenu';
import { BusterListHeader } from './BusterListHeader';
import { BusterListRowComponentSelector } from './BusterListRowComponentSelector';
import { HEIGHT_OF_ROW, HEIGHT_OF_SECTION_ROW } from './config';
import { getAllIdsInSection } from './helpers';
import type { BusterListProps } from './interfaces';

function BusterListVirtuaComponent<T = unknown>({
  columns,
  rows,
  selectedRowKeys,
  onSelectChange,
  emptyState,
  showHeader = true,
  contextMenu,
  showSelectAll = true,
  useRowClickSelectChange = false,
  rowClassName = '',
  hideLastRowBorder = false
}: BusterListProps<T>) {
  const showEmptyState = (!rows || rows.length === 0) && !!emptyState;
  const lastChildIndex = rows.length - 1;
  const lastSelectedIdRef = useRef<string | null>(null);

  const globalCheckStatus = useMemo(() => {
    if (!selectedRowKeys) return 'unchecked';
    if (selectedRowKeys.length === 0) return 'unchecked';
    if (selectedRowKeys.length === rows.length) return 'checked';
    return 'indeterminate';
  }, [selectedRowKeys?.length, rows.length]);

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

  const getItemsBetween = useMemoizedFn((startId: string, endId: string) => {
    const startIndex = rows.findIndex((row) => row.id === startId);
    const endIndex = rows.findIndex((row) => row.id === endId);

    if (startIndex === -1 || endIndex === -1) return [];

    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);

    return rows
      .slice(start, end + 1)
      .filter((row) => !row.rowSection && !row.hidden)
      .map((row) => row.id);
  });

  const onSelectChangePreflight = useMemoizedFn(
    (v: boolean, id: string, event?: React.MouseEvent) => {
      if (!onSelectChange || !selectedRowKeys) return;

      if (event?.shiftKey && lastSelectedIdRef.current) {
        const itemsBetween = getItemsBetween(lastSelectedIdRef.current, id);
        if (v) {
          const newSelectedKeys = Array.from(new Set([...selectedRowKeys, ...itemsBetween]));
          onSelectChange(newSelectedKeys);
        } else {
          onSelectChange(selectedRowKeys.filter((key) => !itemsBetween.includes(key)));
        }
      } else {
        if (v === false) {
          onSelectChange(selectedRowKeys.filter((d) => d !== id));
        } else {
          onSelectChange(selectedRowKeys.concat(id));
        }
      }

      lastSelectedIdRef.current = id;
    }
  );

  const itemSize = useMemoizedFn((index: number) => {
    const row = rows[index];
    return row.rowSection ? HEIGHT_OF_SECTION_ROW : HEIGHT_OF_ROW;
  });

  const itemData = useMemo(() => {
    return {
      columns,
      rows,
      selectedRowKeys,
      onSelectChange: onSelectChange ? onSelectChangePreflight : undefined,
      onSelectSectionChange: onSelectChange ? onSelectSectionChange : undefined,
      useRowClickSelectChange,
      hideLastRowBorder
    };
  }, [
    columns,
    rows,
    useRowClickSelectChange,
    selectedRowKeys,
    onSelectChange,
    onSelectSectionChange,
    hideLastRowBorder
  ]);

  const [WrapperNode, wrapperNodeProps] = useMemo(() => {
    const node = contextMenu ? ContextMenu : React.Fragment;
    const props: ContextMenuProps = contextMenu ? contextMenu : ({} as ContextMenuProps);
    return [node, props];
  }, [contextMenu]);

  return (
    <WrapperNode {...wrapperNodeProps}>
      <div className="list-container relative flex h-full w-full flex-col overflow-hidden">
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

        {!showEmptyState && (
          <VList overscan={10}>
            {rows.map((row, index) => (
              <div key={row.id + index.toString()} style={{ height: itemSize(index) }}>
                <BusterListRowComponentSelector<T>
                  row={row}
                  id={row.id}
                  isLastChild={index === lastChildIndex}
                  {...itemData}
                />
              </div>
            ))}
          </VList>
        )}

        {showEmptyState && (
          <div className="flex h-full items-center justify-center">{emptyState}</div>
        )}
      </div>
    </WrapperNode>
  );
}

export const BusterListVirtua = React.memo(BusterListVirtuaComponent) as <T = unknown>(
  props: BusterListProps<T>
) => React.ReactElement;
