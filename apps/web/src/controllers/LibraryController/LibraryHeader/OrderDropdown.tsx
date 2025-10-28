import { useNavigate } from '@tanstack/react-router';
import React from 'react';
import {
  AssetOrderPopoverButton,
  AssetOrderPopoverContent,
  type AssetOrderPopoverProps,
} from '@/components/features/list/AssetList';
import { setLibraryLayoutCookie } from '@/context/Library/useLibraryLayout';
import type { LibraryViewProps } from '../library.types';
import type { LibraryLayout, LibrarySearchParams } from '../schema';

export const OrderDropdown = React.memo(
  ({
    layout,
    ordering,
    groupBy,
    ordering_direction,
    type,
  }: {
    layout: LibraryLayout;
    ordering: LibrarySearchParams['ordering'];
    groupBy: LibrarySearchParams['group_by'];
    ordering_direction: LibrarySearchParams['ordering_direction'];
    type: LibraryViewProps['type'];
  }) => {
    const props = useOrderDropdownItems({ layout, ordering, groupBy, ordering_direction, type });
    return <AssetOrderPopoverButton {...props} />;
  }
);

export const OrderDropdownContent = React.memo(
  ({
    layout,
    ordering,
    groupBy,
    ordering_direction,
    type,
  }: {
    layout: LibraryLayout;
    ordering: LibrarySearchParams['ordering'];
    groupBy: LibrarySearchParams['group_by'];
    ordering_direction: LibrarySearchParams['ordering_direction'];
    type: LibraryViewProps['type'];
  }) => {
    const props = useOrderDropdownItems({ layout, ordering, groupBy, ordering_direction, type });
    return <AssetOrderPopoverContent {...props} />;
  }
);

const useOrderDropdownItems = ({
  layout,
  ordering,
  groupBy,
  ordering_direction,
  type,
}: {
  layout: LibraryLayout;
  ordering: LibrarySearchParams['ordering'];
  groupBy: LibrarySearchParams['group_by'];
  ordering_direction: LibrarySearchParams['ordering_direction'];
  type: LibraryViewProps['type'];
}): AssetOrderPopoverProps => {
  const navigate = useNavigate();
  return {
    layout,
    ordering,
    groupBy,
    orderingDirection: ordering_direction,
    onChangeLayout: (v) => {
      setLibraryLayoutCookie(v);
      navigate({
        to: type === 'library' ? '/app/library' : '/app/shared-with-me',
        search: (prev) => {
          return { ...prev, layout: v };
        },
      });
    },
    onChangeOrdering: (v) => {
      navigate({
        to: type === 'library' ? '/app/library' : '/app/shared-with-me',
        search: (prev) => {
          return { ...prev, ordering: v };
        },
      });
    },
    onChangeOrderingDirection: (v) => {
      navigate({
        to: type === 'library' ? '/app/library' : '/app/shared-with-me',
        search: (prev) => {
          return { ...prev, ordering_direction: v };
        },
      });
    },
    onChangeGroupBy: (v) => {
      navigate({
        to: type === 'library' ? '/app/library' : '/app/shared-with-me',
        search: (prev) => {
          return { ...prev, group_by: v === 'none' ? undefined : v };
        },
      });
    },
  };
};
