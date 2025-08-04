import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import React, { useMemo } from 'react';
import { cn } from '@/lib/classMerge';
import { Input } from '../inputs/Input';
import { BusterList, type BusterListProps } from '../list/BusterList';
import { Text } from '../typography';
import { BorderedModal, type BorderedModalProps } from './BorderedModal';

export interface InputSelectModalProps<T = unknown> extends Omit<BorderedModalProps, 'children'> {
  inputPlaceholder?: string;
  columns: NonNullable<BusterListProps<T>['columns']>;
  rows: NonNullable<BusterListProps<T>['rows']>;
  emptyState: BusterListProps['emptyState'];
  onSelectChange: NonNullable<BusterListProps['onSelectChange']>;
  selectedRowKeys: NonNullable<BusterListProps['selectedRowKeys']>;
  showHeader?: NonNullable<BusterListProps['showHeader']>;
  searchText: string;
  handleSearchChange: (searchText: string) => void;
}

function InputSelectModalBase<T = unknown>({
  inputPlaceholder = 'Search...',
  columns,
  rows,
  emptyState,
  className,
  onSelectChange,
  selectedRowKeys,
  searchText,
  handleSearchChange,
  showHeader = true,
  ...props
}: InputSelectModalProps<T>) {
  const memoizedHeader = useMemo(() => {
    return (
      <>
        <InputSelecteHeader
          searchText={searchText}
          handleSearchChange={handleSearchChange}
          inputPlaceholder={inputPlaceholder}
        />
        <VisuallyHidden>
          <DialogTitle>Input Modal</DialogTitle>
          <DialogDescription>
            {rows.length} {rows.length === 1 ? 'item' : 'items'} found
          </DialogDescription>
        </VisuallyHidden>
      </>
    );
  }, [searchText, handleSearchChange, inputPlaceholder, rows.length]);

  return (
    <BorderedModal
      header={memoizedHeader}
      className={cn(
        'data-[state=closed]:slide-out-to-top-[5%]! data-[state=open]:slide-in-from-top-[5%]! top-28 translate-y-0',
        className
      )}
      {...props}>
      <div
        className="max-h-[65vh]"
        style={{
          height: (rows.length || 1) * 48 + (showHeader ? 32 : 0) //32 is the height of the header
        }}>
        <BusterList
          columns={columns}
          rows={rows}
          onSelectChange={onSelectChange}
          emptyState={useMemo(
            () => emptyState || <Text variant={'secondary'}>No items found</Text>,
            [emptyState]
          )}
          showHeader={showHeader}
          selectedRowKeys={selectedRowKeys}
          useRowClickSelectChange={true}
          hideLastRowBorder
        />
      </div>
    </BorderedModal>
  );
}

export const InputSelectModal = React.memo(InputSelectModalBase) as typeof InputSelectModalBase & {
  displayName?: string;
};

InputSelectModal.displayName = 'InputSelectModal';

const InputSelecteHeader: React.FC<{
  inputPlaceholder: string;
  searchText: string;
  handleSearchChange: (searchText: string) => void;
}> = ({ inputPlaceholder, searchText, handleSearchChange }) => {
  return (
    <div className="flex items-center justify-between py-1.5">
      <Input
        value={searchText}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder={inputPlaceholder}
        variant={'ghost'}
        type="text"
        size={'tall'}
        autoFocus
      />
    </div>
  );
};
