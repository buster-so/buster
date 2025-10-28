import React, { useState } from 'react';
import { NewCollectionModal } from '@/components/features/modals/NewCollectionModal';
import { toggleLibrarySearch } from '@/components/features/search/LibrarySearchModal/library-store';
import { Button } from '@/components/ui/buttons';
import type { IDropdownItems } from '@/components/ui/dropdown';
import { Dropdown } from '@/components/ui/dropdown';
import { Dots, Plus, Sliders3 } from '@/components/ui/icons';
import BarsFilter from '@/components/ui/icons/NucleoIconOutlined/bars-filter';
import type { LibraryViewProps } from '../library.types';
import type { LibrarySearchParams } from '../schema';
import { FilterDropdownContent, useFilterDropdownItems } from './FilterDropdown';
import { OrderDropdownContent } from './OrderDropdown';

export const LibraryThreeDotMenu = React.memo(
  ({
    type,
    ...rest
  }: {
    type: LibraryViewProps['type'] &
      Pick<
        NonNullable<LibrarySearchParams>,
        | 'layout'
        | 'ordering'
        | 'group_by'
        | 'ordering_direction'
        | 'owner_ids'
        | 'asset_types'
        | 'start_date'
        | 'end_date'
      >;
  }) => {
    const [openCollectionModal, setOpenCollectionModal] = useState(false);

    const items = useLibraryThreeDotMenu({ setOpenCollectionModal, type, ...rest });

    return (
      <>
        <Dropdown items={items} side="bottom" align="end" contentClassName="max-h-fit" modal>
          <Button variant="ghost" prefix={<Dots />} />
        </Dropdown>

        <NewCollectionModal
          open={openCollectionModal}
          onClose={() => setOpenCollectionModal(false)}
          useChangePage={true}
        />
      </>
    );
  }
);

LibraryThreeDotMenu.displayName = 'LibraryThreeDotMenu';

const useLibraryThreeDotMenu = ({
  setOpenCollectionModal,
  type,
  layout = 'grid',
  ordering,
  group_by,
  ordering_direction,
  owner_ids,
  asset_types,
  start_date,
  end_date,
}: {
  setOpenCollectionModal: (open: boolean) => void;
  type: LibraryViewProps['type'];
} & Pick<
  NonNullable<LibrarySearchParams>,
  | 'layout'
  | 'ordering'
  | 'group_by'
  | 'ordering_direction'
  | 'owner_ids'
  | 'asset_types'
  | 'start_date'
  | 'end_date'
>): IDropdownItems => {
  const filterDropdownItems = useFilterDropdownItems({
    owner_ids,
    asset_types,
    start_date,
    end_date,
    type,
    open: true,
  });

  const filterDropdown = {
    label: 'Filters',
    value: 'filters',
    icon: <Sliders3 />,
    closeOnSelect: true,
    items: [
      <div className="py-2 px-2">
        <OrderDropdownContent
          key="view-group-and-sort"
          layout={layout}
          ordering={ordering}
          groupBy={group_by}
          ordering_direction={ordering_direction}
          type={type}
        />
      </div>,
    ],
  };

  const orderDropdown = {
    label: 'View, group and sort',
    value: 'view-group-and-sort',
    icon: <BarsFilter />,
    closeOnSelect: true,
    items: filterDropdownItems,
  };

  if (type === 'library') {
    return [
      {
        label: 'New collection',
        value: 'new-collection',
        icon: <Plus />,
        closeOnSelect: true,
        onClick: () => setOpenCollectionModal(true),
      },
      {
        label: 'Add to library',
        value: 'add-to-library',
        icon: <Plus />,
        closeOnSelect: true,
        onClick: () => toggleLibrarySearch(true),
      },
      {
        type: 'divider',
      },
      filterDropdown,
      orderDropdown,
    ];
  }

  if (type === 'shared-with-me') {
    return [filterDropdown, orderDropdown];
  }

  const _exhaustiveCheck: never = type;
  return [];
};
