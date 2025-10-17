import { useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Sliders3 } from '@/components/ui/icons/NucleoIconOutlined';
import GridLayoutRows from '@/components/ui/icons/NucleoIconOutlined/grid-layout-rows';
import Sorting from '@/components/ui/icons/NucleoIconOutlined/sorting';
import UnorderedList from '@/components/ui/icons/NucleoIconOutlined/unordered-list';
import { Popover } from '@/components/ui/popover';
import { AppSegmented, createSegmentedItems } from '@/components/ui/segmented';
import { Select, type SelectItem } from '@/components/ui/select';
import { Text } from '@/components/ui/typography/Text';
import { setLibraryLayoutCookie } from '@/context/Library/useLibraryLayout';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/utils';
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
    return (
      <Popover
        align="end"
        side="bottom"
        sideOffset={2}
        className="min-w-[275px]"
        content={useMemo(
          () => (
            <div className="flex flex-col gap-y-2">
              <LayoutItem layout={layout} />
              <OrderingItem ordering={ordering} ordering_direction={ordering_direction} />
              <GroupByItem groupBy={groupBy} />
            </div>
          ),
          [layout, ordering, groupBy, ordering_direction]
        )}
      >
        <Button variant="ghost" prefix={<Sliders3 />} onClick={() => {}} />
      </Popover>
    );
  }
);

OrderDropdown.displayName = 'OrderDropdown';

const ItemContainer = ({
  className,
  children,
  title,
}: {
  className?: string;
  children: React.ReactNode;
  title: string;
}) => {
  return (
    <div className={cn('grid grid-cols-[110px_1fr] items-center gap-x-2', className)}>
      <Text size={'sm'} variant={'secondary'}>
        {title}
      </Text>
      {children}
    </div>
  );
};

const LayoutItem = ({ layout }: { layout: LibraryLayout }) => {
  const createLayoutOptions = createSegmentedItems<LibraryLayout>();

  const options = createLayoutOptions([
    {
      value: 'grid' as const,
      icon: <GridLayoutRows />,
      link: {
        to: '/app/library',
        search: (v) => {
          return { ...v, layout: 'grid' as const };
        },
      },
    },
    {
      value: 'list',
      icon: <UnorderedList />,
      link: {
        to: '/app/library',
        search: (v) => {
          return { ...v, layout: 'list' as const };
        },
      },
    },
  ]);

  return (
    <ItemContainer title="Layout">
      <AppSegmented
        options={options}
        value={layout}
        type="track"
        size="medium"
        className="w-full"
        block
        onChange={(v) => {
          setLibraryLayoutCookie(v.value);
        }}
      />
    </ItemContainer>
  );
};

const orderByitems: SelectItem<LibrarySearchParams['ordering']>[] = [
  {
    label: 'None',
    value: 'none',
  },
  {
    label: 'Last opened',
    value: 'last_opened',
  },
  {
    label: 'Created at',
    value: 'created_at',
  },
];

const OrderingItem = ({
  ordering,
  ordering_direction,
}: {
  ordering: LibrarySearchParams['ordering'];
  ordering_direction: LibrarySearchParams['ordering_direction'];
}) => {
  const navigate = useNavigate();

  const value = orderByitems.find((item) => item.value === ordering) || orderByitems[0];

  const onClickOrderingDirection = useMemoizedFn(() => {
    navigate({
      to: '/app/library',
      search: (prev) => {
        return { ...prev, ordering_direction: prev.ordering_direction === 'asc' ? 'desc' : 'asc' };
      },
    });
  });

  return (
    <ItemContainer title="Ordering">
      <div className={cn('flex items-center gap-x-2')}>
        <Select
          items={orderByitems}
          search={false}
          value={value.value}
          onChange={(v) => {
            navigate({
              to: '/app/library',
              search: (prev) => {
                return { ...prev, ordering: v };
              },
            });
          }}
        />

        <Button
          variant="default"
          size={'tall'}
          className={cn('duration-0', ordering_direction === 'desc' ? 'rotate-180 ' : '')}
          prefix={<Sorting />}
          onClick={onClickOrderingDirection}
        />
      </div>
    </ItemContainer>
  );
};

const groupByItems: SelectItem<LibrarySearchParams['group_by']>[] = [
  {
    label: 'No grouping',
    value: 'none',
  },
  {
    label: 'Asset type',
    value: 'asset_type',
  },
  {
    label: 'Owner',
    value: 'owner',
  },
  {
    label: 'Created at',
    value: 'created_at',
  },
];

const GroupByItem = ({ groupBy }: { groupBy: LibrarySearchParams['group_by'] }) => {
  const navigate = useNavigate();

  const value = groupByItems.find((item) => item.value === groupBy) || groupByItems[0];

  return (
    <ItemContainer title="Group by">
      <Select
        items={groupByItems}
        search={false}
        value={value.value}
        onChange={(v) => {
          navigate({
            to: '/app/library',
            search: (prev) => {
              return { ...prev, group_by: v };
            },
          });
        }}
      />
    </ItemContainer>
  );
};
