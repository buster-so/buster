import React from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { createDropdownItems } from '@/components/ui/dropdown';
import BarsFilter from '@/components/ui/icons/NucleoIconOutlined/bars-filter';
import type { LibrarySearchParams } from '../schema';

export const FilterDropdown = React.memo(
  ({
    owner_ids,
    asset_types,
    start_date,
    end_date,
  }: {
    owner_ids: LibrarySearchParams['owner_ids'];
    asset_types: LibrarySearchParams['asset_types'];
    start_date: LibrarySearchParams['start_date'];
    end_date: LibrarySearchParams['end_date'];
  }) => {
    const dropdownItems = createDropdownItems([]);

    return <Button variant="ghost" prefix={<BarsFilter />} onClick={() => {}} />;
  }
);
