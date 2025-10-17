import React, { useMemo } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Dots, Plus, Sliders3 } from '@/components/ui/icons';
import BarsFilter from '@/components/ui/icons/NucleoIconOutlined/bars-filter';
import { AppSegmented, createSegmentedItems, type SegmentedItem } from '@/components/ui/segmented';
import { Text } from '@/components/ui/typography/Text';
import { useLibraryLayout } from '@/context/Library/useLibraryLayout';
import type { LibraryLayout, LibrarySearchParams } from './schema';

export const LibraryHeader: React.FC<{
  layout: LibraryLayout;
  setLayout: (layout: LibraryLayout) => void;
  filters: LibrarySearchParams;
}> = React.memo(({ layout, setLayout, filters }) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-3">
        <Text>Library</Text>
        <FilterSwitch filter={filters.filter} />
      </div>
      <div className="flex items-center space-x-1">
        <Button variant="ghost" prefix={<Plus />} onClick={() => {}} />
        <Button variant="ghost" prefix={<BarsFilter />} onClick={() => {}} />
        <Button variant="ghost" prefix={<Sliders3 />} onClick={() => {}} />
        <Button variant="ghost" prefix={<Dots />} onClick={() => {}} />
      </div>
    </div>
  );
});

type FilterType = 'all' | 'owned_by_me' | 'shared_with_me';

const FilterSwitch: React.FC<{
  filter: LibrarySearchParams['filter'];
}> = ({ filter }) => {
  const selectedFilter: FilterType = filter ?? 'all';

  const createFilterSegmentedItems = createSegmentedItems<FilterType>();

  const options: SegmentedItem<FilterType>[] = createFilterSegmentedItems([
    {
      label: 'All',
      value: 'all',
      link: {
        to: '/app/library',
        search: (v) => {
          return { ...v, owner_id: undefined, filter: 'all' as const };
        },
      },
    },
    {
      label: 'Owned by me',
      value: 'owned_by_me',
      link: {
        to: '/app/library',
        search: (v) => {
          return { ...v, owner_id: undefined, filter: 'owned_by_me' as const };
        },
      },
    },
    {
      label: 'Shared with me',
      value: 'shared_with_me',
      link: {
        to: '/app/library',
        search: (v) => {
          return { ...v, owner_id: undefined, filter: 'shared_with_me' as const };
        },
      },
    },
  ]);

  return <AppSegmented value={selectedFilter} options={options} type="button" />;
};
