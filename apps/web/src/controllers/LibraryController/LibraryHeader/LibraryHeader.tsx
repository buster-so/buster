import React from 'react';
import {
  LibrarySearchModal,
  toggleLibrarySearch,
} from '@/components/features/search/LibrarySearchModal';
import { Button } from '@/components/ui/buttons/Button';
import { Dots, Plus, Sliders3 } from '@/components/ui/icons';
import { Tooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography/Text';
import type { LibraryLayout, LibrarySearchParams } from '../schema';
import { FilterDropdown } from './FilterDropdown';
import { FilterSwitch } from './FilterSwitch';
import { OrderDropdown } from './OrderDropdown';

export const LibraryHeader: React.FC<{
  layout: LibraryLayout;
  filters: LibrarySearchParams;
}> = React.memo(({ layout, filters }) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-3">
        <Text>Library</Text>
        <FilterSwitch filter={filters.filter} />
      </div>
      <div className="flex items-center space-x-1">
        <OpenLibrarySearchModalButton />
        <FilterDropdown
          owner_ids={filters.owner_ids}
          asset_types={filters.asset_types}
          start_date={filters.start_date}
          end_date={filters.end_date}
        />
        <OrderDropdown
          layout={layout}
          ordering={filters.ordering}
          groupBy={filters.group_by}
          ordering_direction={filters.ordering_direction}
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
      <LibrarySearchModal />
    </React.Fragment>
  );
};
