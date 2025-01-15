import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BusterListProps } from './interfaces';
import { VariableSizeList as List } from 'react-window';
import { useMemoizedFn } from 'ahooks';
import { BusterListContentMenu } from './BusterListContentMenu';
import AutoSizer from 'react-virtualized-auto-sizer';
import { HEIGHT_OF_SECTION_ROW, HEIGHT_OF_ROW } from './config';
import { getAllIdsInSection } from './helpers';
import { BusterListHeader } from './BusterListHeader';
import { BusterListRowComponentSelector } from './BusterListRowComponentSelector';

export const BusterList: React.FC<BusterListProps> = ({
  columns,
  rows,
  selectedRowKeys,
  onSelectChange,
  emptyState,
  showHeader = true,
  contextMenu,
  showSelectAll = true
}) => {
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const showEmptyState = (!rows || rows.length === 0) && !!emptyState;

  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
    scrollYPosition: number;
    show: boolean;
    id: string;
  } | null>(null);

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

  const onContextMenuClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>, id: string) => {
    if (!contextMenu) return;
    e.stopPropagation();
    e.preventDefault();
    const x = e.clientX - 5;
    const y = e.clientY - 5; // offset the top by 30px
    const menuWidth = 250; // width of the menu
    const menuHeight = 200; // height of the menu
    const pageWidth = window.innerWidth;
    const pageHeight = window.innerHeight;

    // Ensure the menu does not render offscreen horizontally
    const adjustedX = Math.min(Math.max(0, x), pageWidth - menuWidth);
    // Ensure the menu does not render offscreen vertically, considering the offset
    const adjustedY = Math.min(Math.max(0, y), pageHeight - menuHeight);

    setContextMenuPosition({
      x: adjustedX,
      y: adjustedY,
      show: true,
      id: id,
      scrollYPosition: window.scrollY
    });
  });

  // const { run: onScrollListener } = useDebounceFn(
  //   useMemoizedFn((e: React.UIEvent<HTMLDivElement>) => {
  //     if (!contextMenu) return;
  //     const newScrollY = (e.target as HTMLElement).scrollTop;
  //     const scrollYDelta = newScrollY - scrollY.current;
  //     const hasMoved50PixelsFromScrollYPosition =
  //       Math.abs((contextMenuPosition?.scrollYPosition || 0) - newScrollY) > 35;
  //     scrollY.current = newScrollY;
  //     setContextMenuPosition((v) => ({
  //       ...v!,
  //       show: !!v?.show && !hasMoved50PixelsFromScrollYPosition,
  //       y: (v?.y || 0) - scrollYDelta
  //     }));
  //   }),
  //   { wait: 50 }
  // );

  const itemSize = useMemoizedFn((index: number) => {
    const row = rows[index];
    return row.rowSection ? HEIGHT_OF_SECTION_ROW : HEIGHT_OF_ROW;
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
      onContextMenuClick
    };
  }, [columns, rows, selectedRowKeys, onSelectChange, onSelectSectionChange, onContextMenuClick]);

  //context menu click away
  useEffect(() => {
    if (contextMenu && contextMenuPosition?.show) {
      const listenForClickAwayFromContextMenu = (e: MouseEvent) => {
        if (!contextMenuRef.current?.contains(e.target as Node)) {
          setContextMenuPosition((v) => ({
            ...v!,
            show: false
          }));
        }
      };
      document.addEventListener('click', listenForClickAwayFromContextMenu);
      return () => {
        document.removeEventListener('click', listenForClickAwayFromContextMenu);
      };
    }
  }, [contextMenuRef, contextMenuPosition?.show, contextMenu]);

  return (
    <div
      className="list-container relative flex h-full w-full flex-col overflow-hidden"
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
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                width={width}
                estimatedItemSize={HEIGHT_OF_ROW}
                overscanCount={10}
                itemData={itemData}
                itemSize={itemSize}
                itemCount={rows.length}>
                {({ index, style, data }) => (
                  <BusterListRowComponentSelector
                    style={style}
                    row={rows[index]}
                    id={rows[index].id}
                    {...data}
                  />
                )}
              </List>
            )}
          </AutoSizer>
        </div>
      )}

      {showEmptyState && (
        <div className="flex h-full items-center justify-center">{emptyState}</div>
      )}

      {contextMenu && contextMenuPosition?.id && (
        <BusterListContentMenu
          ref={contextMenuRef}
          open={!!contextMenuPosition?.show}
          menu={contextMenu}
          id={contextMenuPosition?.id || ''}
          placement={{ x: contextMenuPosition?.x || 0, y: contextMenuPosition?.y || 0 }}
        />
      )}
    </div>
  );
};
BusterList.displayName = 'BusterList';
// Add a memoized checkbox component
