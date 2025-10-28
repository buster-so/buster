import React from 'react';
import { AppSegmented, createSegmentedItems, type SegmentedItem } from '@/components/ui/segmented';
import type { LibraryViewProps } from '../library.types';
import type { LibrarySearchParams, SharedWithMeSearchParams } from '../schema';

type FilterSwitchLibraryProps = {
  type: 'library';
  filter: LibrarySearchParams['filter'];
};

type FilterSwitchSharedWithMeProps = {
  type: 'shared-with-me';
  filter: SharedWithMeSearchParams['filter'];
};

type FilterType =
  | NonNullable<FilterSwitchLibraryProps['filter']>
  | NonNullable<FilterSwitchSharedWithMeProps['filter']>;

export const FilterSwitch: React.FC<FilterSwitchLibraryProps | FilterSwitchSharedWithMeProps> =
  React.memo((props) => {
    const { filter, type } = props;
    const selectedFilter = filter ?? 'all';

    const createFilterSegmentedItems = createSegmentedItems<FilterType>();

    const options: SegmentedItem<FilterType>[] =
      type === 'library'
        ? createFilterSegmentedItems([
            {
              label: 'All',
              value: 'all',
              link: {
                to: '/app/library',
                search: (v) => {
                  return { ...v, owner_id: undefined, filter: undefined };
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
          ])
        : [
            {
              label: 'All',
              value: 'all',
              link: {
                to: '/app/shared-with-me',
                search: (v) => {
                  return { ...v, filter: 'all' as const };
                },
              },
            },
            {
              label: 'Collections',
              value: 'collections',
              link: {
                to: '/app/shared-with-me',
                search: (v) => {
                  return { ...v, filter: 'collections' as const };
                },
              },
            },
            {
              label: 'Assets',
              value: 'assets',
              link: {
                to: '/app/shared-with-me',
                search: (v) => {
                  return { ...v, filter: 'assets' as const };
                },
              },
            },
          ];

    return <AppSegmented value={selectedFilter} options={options} type="button" />;
  });

FilterSwitch.displayName = 'FilterSwitch';
