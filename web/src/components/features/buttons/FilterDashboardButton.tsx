import React, { useMemo } from 'react';
import { Button } from '@/components/ui/buttons';
import { ArrowUpRight, BarsFilter } from '@/components/ui/icons';
import { Dropdown } from '@/components/ui/dropdown';
import { MagnifierSparkle } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { DropdownMenuHeaderSearch } from '@/components/ui/dropdown/DropdownMenuHeaderSearch';
import { useDebounceSearch, useMemoizedFn } from '@/hooks';

const items = Array.from({ length: 100 }, (_, index) => {
  const randomWord = 'Filter ' + index;
  return {
    label: randomWord,
    value: randomWord + index
  };
});

export const FilterDashboardButton: React.FC = React.memo(() => {
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: items,
    searchPredicate: (item, searchText) =>
      item.label.toLowerCase().includes(searchText.toLowerCase())
  });

  const onSelectItem = useMemoizedFn((value: (typeof filteredItems)[number]['value']) => {
    //
  });

  const onPressEnter = useMemoizedFn(() => {
    //
  });

  const menuHeader = useMemo(() => {
    return (
      <div className="flex flex-col">
        <DropdownMenuHeaderSearch
          placeholder="Search filters..."
          className="p-1"
          text={searchText}
          onChange={handleSearchChange}
          onPressEnter={onPressEnter}
        />
        <div className="flex border-t p-1">
          <div
            className={cn(
              'flex h-8 w-full cursor-pointer items-center gap-x-1.5 rounded px-2.5',
              searchText
                ? 'bg-item-select hover:bg-item-select'
                : 'cursor-not-allowed bg-transparent'
            )}>
            <span className="text-icon-color">
              <MagnifierSparkle />
            </span>
            <Text className="whitespace-nowrap" variant="default">
              AI Filter
            </Text>
            {searchText && (
              <Text truncate variant="tertiary">
                "{searchText}"
              </Text>
            )}
          </div>
        </div>
      </div>
    );
  }, [searchText]);

  const showFooter = useMemo(() => {
    if (!items.length) return false;
    if (!searchText) return true;
    return 'Manage filters'.toLowerCase().includes(searchText.toLowerCase());
  }, [items, searchText]);

  const footerContent = useMemo(() => {
    if (!showFooter) return null;
    return (
      <div className="hover:bg-item-select flex cursor-pointer items-center gap-x-1 rounded px-2 py-1 transition">
        <span className="text-icon-color">
          <ArrowUpRight />
        </span>
        <Text variant="default">Manage filters</Text>
      </div>
    );
  }, [showFooter]);

  return (
    <Dropdown
      items={filteredItems}
      menuHeader={menuHeader}
      footerContent={footerContent}
      showEmptyState={false}
      emptyStateText="No filters found"
      menuHeaderClassName="p-0!"
      onSelect={onSelectItem}>
      <Button variant="ghost" prefix={<BarsFilter />} data-testid="filter-dashboard-button">
        Filter
      </Button>
    </Dropdown>
  );
});

FilterDashboardButton.displayName = 'FilterDashboardButton';
