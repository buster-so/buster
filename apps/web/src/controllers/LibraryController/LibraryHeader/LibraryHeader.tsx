import React, { lazy } from 'react';
import { prefetchSearchInfinite } from '@/api/buster_rest/search';
import { LazyErrorBoundary } from '@/components/features/global/LazyErrorBoundary';
import { toggleLibrarySearch } from '@/components/features/search/LibrarySearchModal/library-store';
import { Button } from '@/components/ui/buttons/Button';
import { Dots, Plus } from '@/components/ui/icons';
import { Tooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography/Text';
import type { LibraryViewProps, SharedWithMeViewProps } from '../library.types';
import type { LibraryLayout, LibrarySearchParams } from '../schema';
import { FilterDropdown } from './FilterDropdown';
import { FilterSwitch } from './FilterSwitch';
import { OrderDropdown } from './OrderDropdown';

const LibrarySearchModal = lazy(() =>
  import('@/components/features/search/LibrarySearchModal/LibrarySearchModal').then((module) => ({
    default: module.LibrarySearchModal,
  }))
);

export const LibraryHeader: React.FC<{
  layout: LibraryLayout;
  filters: LibrarySearchParams;
  type: LibraryViewProps['type'] | SharedWithMeViewProps['type'];
}> = React.memo(({ layout, filters, type }) => {
  const title = type === 'library' ? 'Library' : 'Shared with me';

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-3">
        <Text>{title}</Text>
        <FilterSwitch filter={filters.filter} type={type} />
      </div>
      <div className="flex items-center space-x-1">
        {type === 'library' && <OpenLibrarySearchModalButton />}
        <FilterDropdown
          owner_ids={filters.owner_ids}
          asset_types={filters.asset_types}
          start_date={filters.start_date}
          end_date={filters.end_date}
          type={type}
        />
        <OrderDropdown
          layout={layout}
          ordering={filters.ordering}
          groupBy={filters.group_by}
          ordering_direction={filters.ordering_direction}
          type={type}
        />
        <Button variant="ghost" prefix={<Dots />} onClick={() => {}} />
      </div>
    </div>
  );
});

const OpenLibrarySearchModalButton = () => {
  return (
    <React.Fragment>
      <Tooltip title="Add to library">
        <Button
          variant="ghost"
          prefix={<Plus />}
          onClick={() => {
            toggleLibrarySearch(true);
          }}
        />
      </Tooltip>
      <LazyErrorBoundary>
        <LibrarySearchModal />
      </LazyErrorBoundary>
    </React.Fragment>
  );
};
