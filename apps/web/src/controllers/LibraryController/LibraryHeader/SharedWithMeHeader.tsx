import React from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Dots } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography/Text';
import type { LibraryLayout, LibrarySearchParams, SharedWithMeSearchParams } from '../schema';
import { FilterDropdown } from './FilterDropdown';
import { FilterSwitch } from './FilterSwitch';
import { OrderDropdown } from './OrderDropdown';

type SharedWithMeHeaderProps = {
  layout: LibraryLayout;
  filters: SharedWithMeSearchParams;
  type: 'shared-with-me';
};

type LibraryHeaderProps = {
  layout: LibraryLayout;
  filters: LibrarySearchParams;
  type: 'library';
};

export const LibraryHeader: React.FC<SharedWithMeHeaderProps | LibraryHeaderProps> = React.memo(
  (props) => {
    const { layout, filters, type } = props;
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <Text>Library</Text>
          {type === 'library' ? (
            <FilterSwitch filter={filters.filter} type="library" />
          ) : (
            <FilterSwitch filter={filters.filter} type="shared-with-me" />
          )}
        </div>
        <div className="flex items-center space-x-1">
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
  }
);
