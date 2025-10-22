import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import type React from 'react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
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

  const onSelectSectionChange = useMemoizedFn((v: boolean, id: string) => {
    console.log('onSelectSectionChange', v, id);
    if (!onSelectChange) return;

    const selectedSectionIds = idsPerSection.get(id);
    if (!selectedSectionIds) {
      console.warn('Selected section ids not found', id);
      return;
    }
    const newSelectedRowKeys = v
      ? new Set([...selectedRowKeys, ...selectedSectionIds])
      : new Set(selectedRowKeys.filter((d) => !selectedSectionIds.has(d)));
    onSelectChange?.(newSelectedRowKeys);
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
            idsPerSection={idsPerSection}
            selectedRowKeys={selectedRowKeys}
            onSelectChange={onSelectChange}
            onSelectSectionChange={onSelectChange ? onSelectSectionChange : undefined}
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
  start,
  rows,
  columns,
  size,
  idsPerSection,
  onSelectSectionChange,
  ...rest
}: VirtualItem & {
  idsPerSection: Map<string, Set<string>>;
  onSelectSectionChange: ((v: boolean, id: string) => void) | undefined;
} & Pick<BusterListProps<T>, 'selectedRowKeys' | 'onSelectChange' | 'rows' | 'columns'>) => {
  const selectedRow = rows[index];
  const isSection = selectedRow.type === 'section';

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
        />
      ) : (
        <BusterListRowComponent {...rest} {...selectedRow} />
      )}
    </div>
  );
};
