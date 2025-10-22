import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import type React from 'react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { BusterListRowComponent } from './BusterListRowComponent';
import { BusterListRowSection } from './BusterListRowSection';
import { HEIGHT_OF_ROW, HEIGHT_OF_SECTION_ROW } from './config';
import type {
  BusterListColumn,
  BusterListImperativeHandle,
  BusterListProps,
  BusterListRow,
} from './interfaces';

function BusterListInner<T = unknown>(
  {
    columns,
    rows,
    onSelectChange,
    emptyState,
    showHeader,
    selectedRowKeys,
    contextMenu,
    showSelectAll,
    useRowClickSelectChange,
    rowClassName,
    className,
    hideLastRowBorder,
    infiniteScrollConfig,
  }: BusterListProps<T>,
  ref: React.Ref<BusterListImperativeHandle>
) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (rows[i].type === 'row' ? HEIGHT_OF_ROW : HEIGHT_OF_SECTION_ROW),
    overscan: 5,
  });

  useImperativeHandle(ref, () => ({
    scrollTo: (id: string) => {
      // TODO: Implement scroll to functionality
      console.log('Scrolling to:', id);
    },
  }));

  const idsPerSection: Map<string, Set<string>> = useMemo(() => {
    const idsPerSection = new Map<string, Set<string>>();
    let currentSectionId: string | undefined;
    rows.forEach((row) => {
      if (row.type === 'section') {
        idsPerSection.set(row.id, new Set());
        currentSectionId = row.id;
      }
      if (row.type === 'row' && currentSectionId) {
        const section = idsPerSection.get(currentSectionId);
        if (section) {
          section.add(row.id);
        }
      }
    });
    return idsPerSection;
  }, [rows]);

  return (
    <div ref={parentRef} className="overflow-y-auto overflow-x-hidden h-full w-full">
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
            key={virtualRow.key}
          />
        ))}
      </div>
    </div>
  );
}

export const BusterList = forwardRef(BusterListInner) as unknown as <T = unknown>(
  props: BusterListProps<T> & { ref?: React.Ref<BusterListImperativeHandle> }
) => ReturnType<typeof BusterListInner>;

const BusterListRowSelector = <T = unknown>({
  index,
  size,
  start,
  rows,
  columns,
  ...rest
}: VirtualItem & { rows: BusterListRow<T>[]; columns: BusterListColumn<T>[] }) => {
  const selectedRow = rows[index];
  const isSection = selectedRow.type === 'section';

  return (
    <div
      key={index}
      className="absolute top-0 left-0 w-full h-full"
      style={{ transform: `translateY(${start}px)` }}
    >
      {isSection ? (
        <BusterListRowSection {...selectedRow} />
      ) : (
        <BusterListRowComponent {...selectedRow} />
      )}
    </div>
  );
};
