import React from 'react';
import { AppSegmented, createSegmentedItems, type SegmentedItem } from '@/components/ui/segmented';
import type { LibrarySearchParams } from '../schema';

type FilterType = 'all' | 'owned_by_me' | 'shared_with_me';

export const FilterSwitch: React.FC<{
  filter: LibrarySearchParams['filter'];
}> = React.memo(({ filter }) => {
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
});

FilterSwitch.displayName = 'FilterSwitch';
