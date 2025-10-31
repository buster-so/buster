import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import type React from 'react';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/utils';
import { BusterListHeader } from './BusterListHeader';
import { BusterListRowComponent } from './BusterListRowComponent';
import { BusterListRowSection } from './BusterListRowSection';
import { HEIGHT_OF_ROW, HEIGHT_OF_SECTION_ROW } from './config';
import type { BusterListImperativeHandle, BusterListProps } from './interfaces';
import { useInfiniteScroll } from './useInfiniteScroll';

// Conditional wrapper defined outside to prevent remounting
function ConditionalContextMenuWrapper<T>({
  children,
  ContextMenu,
  contextMenuProps,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  ContextMenu?: React.ComponentType<
    React.PropsWithChildren<T & { open?: boolean; onOpenChange?: (open: boolean) => void }>
  >;
  contextMenuProps: T | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  if (ContextMenu && contextMenuProps) {
    return (
      <ContextMenu {...contextMenuProps} open={open} onOpenChange={onOpenChange}>
        {children}
      </ContextMenu>
    );
  }
  return <>{children}</>;
}

function BusterListBase<T = unknown>(
  {
    columns,
    rows,
    onSelectChange,
    emptyState,
    showHeader,
    selectedRowKeys,
    ContextMenu,
    showSelectAll,
    rowClassName,
    className,
    hideLastRowBorder,
    infiniteScrollConfig,
    scrollParentRef: externalScrollParentRef,
  }: BusterListProps<T>,
  ref: React.Ref<BusterListImperativeHandle>
) {
  const internalScrollParentRef = useRef<HTMLDivElement>(null);

  // Callback ref to merge internal and external refs
  const mergedScrollRef = (node: HTMLDivElement | null) => {
    // Always update internal ref
    internalScrollParentRef.current = node;

    // Update external ref if provided
    if (externalScrollParentRef) {
      if (typeof externalScrollParentRef === 'function') {
        externalScrollParentRef(node);
      } else {
        // It's a RefObject
        (externalScrollParentRef as { current: HTMLDivElement | null }).current = node;
      }
    }
  };

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => internalScrollParentRef.current,
    estimateSize: (i) => (rows[i].type === 'row' ? HEIGHT_OF_ROW : HEIGHT_OF_SECTION_ROW),
    overscan: 7,
  });

  const onSelectSectionChange = useMemoizedFn((v: boolean, id: string) => {
    if (!onSelectChange) return;

    const selectedSectionIds = idsPerSection.get(id);
    if (!selectedSectionIds) {
      console.warn('Selected section ids not found', id);
      return;
    }

    const currentSelection = selectedRowKeys || new Set<string>();

    const newSelectedRowKeys = v
      ? new Set([...currentSelection, ...selectedSectionIds])
      : new Set([...currentSelection].filter((d) => !selectedSectionIds.has(d)));

    onSelectChange(newSelectedRowKeys);
  });

  const onSelectRowChange = useMemoizedFn((v: boolean, id: string, _e: React.MouseEvent) => {
    if (!onSelectChange) return;
    const currentSelection = selectedRowKeys || new Set<string>();
    const newSelectedRowKeys = v
      ? new Set([...currentSelection, id])
      : new Set([...currentSelection].filter((d) => d !== id));
    onSelectChange(newSelectedRowKeys);
  });

  const onGlobalSelectChange = useMemoizedFn((_v: boolean) => {
    if (!onSelectChange) return;
    const allIdsAreSelected = rows.length === selectedRowKeys?.size;
    const selectedSet = !allIdsAreSelected ? new Set(rows.map((row) => row.id)) : new Set<string>();
    console.log(selectedSet, rows.length);
    onSelectChange(selectedSet);
  });

  useImperativeHandle(ref, () => ({
    scrollTo: (id: string) => {
      // TODO: Implement scroll to functionality
      console.log('Scrolling to:', id);
    },
  }));

  const idsPerSection: Map<string, Set<string>> = useMemo(() => {
    const idsPerSection = new Map<string, Set<string>>();
    let currentSection: Set<string> | undefined;
    for (const row of rows) {
      if (row.type === 'section') {
        currentSection = new Set();
        idsPerSection.set(row.id, currentSection);
      } else if (row.type === 'row' && currentSection) {
        currentSection.add(row.id);
      }
    }
    return idsPerSection;
  }, [rows]);

  // Track which row was right-clicked for context menu
  const [selectedRowData, setSelectedRowData] = useState<T | null>(() => {
    // Initialize with first row data or null
    const firstRow = rows.find((r) => r.type === 'row' && r.data);
    return firstRow?.type === 'row' ? firstRow.data : null;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleContextMenu = useCallback((data: T | null) => {
    flushSync(() => {
      setSelectedRowData(data);
    });
  }, []);

  useInfiniteScroll({
    scrollElementRef: internalScrollParentRef,
    infiniteScrollConfig,
  });

  if (emptyState && rows.length === 0) {
    return <div className={cn('h-full flex flex-col', className)}>{emptyState}</div>;
  }

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {showHeader && (
        <BusterListHeader
          columns={columns}
          rowClassName={rowClassName}
          showSelectAll={showSelectAll}
          rowsLength={rows.length}
          selectedRowKeys={selectedRowKeys}
          onGlobalSelectChange={onSelectChange ? onGlobalSelectChange : undefined}
        />
      )}
      <ConditionalContextMenuWrapper<T>
        ContextMenu={ContextMenu}
        contextMenuProps={selectedRowData}
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
      >
        <div
          ref={mergedScrollRef}
          className="overflow-y-auto overflow-x-hidden flex-1 w-full scrollbar-thin"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <BusterListRowSelector
                {...virtualRow}
                rows={rows}
                columns={columns}
                idsPerSection={idsPerSection}
                selectedRowKeys={selectedRowKeys}
                onSelectRowChange={onSelectChange ? onSelectRowChange : undefined}
                onSelectSectionChange={onSelectChange ? onSelectSectionChange : undefined}
                onContextMenu={ContextMenu ? handleContextMenu : undefined}
                hideLastRowBorder={hideLastRowBorder}
                key={virtualRow.key}
              />
            ))}
          </div>

          {infiniteScrollConfig?.loadingNewContent && (
            <div className="flex items-center justify-center py-1.5 pointer-events-none">
              {infiniteScrollConfig.loadingNewContent}
            </div>
          )}
        </div>
      </ConditionalContextMenuWrapper>
    </div>
  );
}

export const BusterList = forwardRef(BusterListBase) as unknown as <T = unknown>(
  props: BusterListProps<T> & { ref?: React.Ref<BusterListImperativeHandle> }
) => ReturnType<typeof BusterListBase>;

const BusterListRowSelector = <T = unknown>({
  index,
  start,
  rows,
  size,
  idsPerSection,
  hideLastRowBorder,
  selectedRowKeys,
  onSelectRowChange,
  onSelectSectionChange,
  onContextMenu,
  ...rest
}: VirtualItem & {
  idsPerSection: Map<string, Set<string>>;
  onSelectSectionChange: ((v: boolean, id: string) => void) | undefined;
  onSelectRowChange: ((v: boolean, id: string, e: React.MouseEvent) => void) | undefined;
  onContextMenu: ((data: T | null) => void) | undefined;
} & Pick<
    BusterListProps<T>,
    'selectedRowKeys' | 'rows' | 'columns' | 'hideLastRowBorder' | 'useRowClickSelectChange'
  >) => {
  const selectedRow = rows[index];
  const isSection = selectedRow.type === 'section';
  const isLastChild = index === rows.length - 1;

  return (
    <div
      key={index}
      className="absolute top-0 left-0 w-full h-full"
      style={{ transform: `translateY(${start}px)`, height: `${size}px` }}
    >
      {isSection ? (
        <BusterListRowSection
          {...rest}
          {...selectedRow}
          idsPerSection={idsPerSection}
          onSelectSectionChange={onSelectSectionChange}
          selectedRowKeys={selectedRowKeys}
        />
      ) : (
        <BusterListRowComponent
          {...rest}
          {...selectedRow}
          hideLastRowBorder={hideLastRowBorder}
          checked={!!selectedRowKeys?.has(selectedRow.id)}
          isLastChild={isLastChild}
          onSelectRowChange={onSelectRowChange}
          onContextMenu={onContextMenu}
        />
      )}
    </div>
  );
};
