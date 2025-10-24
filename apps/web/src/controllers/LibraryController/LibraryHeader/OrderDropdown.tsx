import { useNavigate } from '@tanstack/react-router';
import React from 'react';
import { AssetOrderPopover } from '@/components/features/list/AssetList';
import { setLibraryLayoutCookie } from '@/context/Library/useLibraryLayout';
import type { LibraryLayout, LibrarySearchParams } from '../schema';

export const OrderDropdown = React.memo(
  ({
    layout,
    ordering,
    groupBy,
    ordering_direction,
  }: {
    layout: LibraryLayout;
    ordering: LibrarySearchParams['ordering'];
    groupBy: LibrarySearchParams['group_by'];
    ordering_direction: LibrarySearchParams['ordering_direction'];
  }) => {
    const navigate = useNavigate();
    return (
      <AssetOrderPopover
        layout={layout}
        ordering={ordering}
        groupBy={groupBy}
        orderingDirection={ordering_direction}
        onChangeLayout={(v) => {
          setLibraryLayoutCookie(v);
          navigate({
            to: '/app/library',
            search: (prev) => {
              return { ...prev, layout: v };
            },
          });
        }}
        onChangeOrdering={(v) => {
          navigate({
            to: '/app/library',
            search: (prev) => {
              return { ...prev, ordering: v };
            },
          });
        }}
        onChangeOrderingDirection={(v) => {
          navigate({
            to: '/app/library',
            search: (prev) => {
              return { ...prev, ordering_direction: v };
            },
          });
        }}
        onChangeGroupBy={(v) => {
          navigate({
            to: '/app/library',
            search: (prev) => {
              return { ...prev, group_by: v };
            },
          });
        }}
      />
    );
  }
);
