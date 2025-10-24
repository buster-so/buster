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
import { Tooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography/Text';
import { setLibraryLayoutCookie } from '@/context/Library/useLibraryLayout';
import type { LibrarySearchParams } from '@/controllers/LibraryController/schema';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/utils';

type AssetOrderPopoverProps = {
  layout: 'grid' | 'list';
  ordering: 'updated_at' | 'created_at' | 'none' | undefined;
  groupBy: 'asset_type' | 'owner' | 'created_at' | 'updated_at' | 'none' | undefined;
  orderingDirection: 'asc' | 'desc' | undefined;
  onChangeLayout: (layout: AssetOrderPopoverProps['layout']) => void;
  onChangeOrdering: (ordering: AssetOrderPopoverProps['ordering']) => void;
  onChangeOrderingDirection: (
    orderingDirection: AssetOrderPopoverProps['orderingDirection']
  ) => void;
  onChangeGroupBy: (groupBy: AssetOrderPopoverProps['groupBy']) => void;
};

export const AssetOrderPopover = React.memo(
  ({
    layout,
    ordering,
    groupBy,
    orderingDirection,
    onChangeLayout,
    onChangeOrdering,
    onChangeOrderingDirection,
    onChangeGroupBy,
  }: AssetOrderPopoverProps) => {
    return (
      <Popover
        align="end"
        side="bottom"
        sideOffset={2}
        className="min-w-[275px]"
        content={useMemo(
          () => (
            <div className="flex flex-col gap-y-2">
              <LayoutItem layout={layout} onChangeLayout={onChangeLayout} />
              <OrderingItem
                ordering={ordering}
                orderingDirection={orderingDirection}
                onChangeOrdering={onChangeOrdering}
                onChangeOrderingDirection={onChangeOrderingDirection}
              />
              <GroupByItem groupBy={groupBy} onChangeGroupBy={onChangeGroupBy} />
            </div>
          ),
          [layout, ordering, groupBy, orderingDirection]
        )}
      >
        <Tooltip title="View, group and sort">
          <Button variant="ghost" prefix={<Sliders3 />} onClick={() => {}} />
        </Tooltip>
      </Popover>
    );
  }
);

AssetOrderPopover.displayName = 'AssetOrderPopover';

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

const LayoutItem = ({
  layout,
  onChangeLayout,
}: {
  layout: AssetOrderPopoverProps['layout'];
  onChangeLayout: (layout: AssetOrderPopoverProps['layout']) => void;
}) => {
  const createLayoutOptions = createSegmentedItems<AssetOrderPopoverProps['layout']>();

  const options = createLayoutOptions([
    {
      value: 'grid' as const,
      icon: <GridLayoutRows />,
      onClick: () => {
        onChangeLayout('grid');
      },
    },
    {
      value: 'list',
      icon: <UnorderedList />,
      onClick: () => {
        onChangeLayout('list');
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
    label: 'Updated at',
    value: 'updated_at',
  },
  {
    label: 'Created at',
    value: 'created_at',
  },
];

const OrderingItem = ({
  ordering,
  orderingDirection,
  onChangeOrdering,
  onChangeOrderingDirection,
}: {
  ordering: LibrarySearchParams['ordering'];
  orderingDirection: 'asc' | 'desc' | undefined;
  onChangeOrdering: (ordering: LibrarySearchParams['ordering']) => void;
  onChangeOrderingDirection: (orderingDirection: 'asc' | 'desc') => void;
}) => {
  const navigate = useNavigate();

  const value = orderByitems.find((item) => item.value === ordering) || orderByitems[0];

  const onClickOrderingDirection = useMemoizedFn(() => {
    onChangeOrderingDirection(orderingDirection === 'desc' ? 'asc' : 'desc');
  });

  return (
    <ItemContainer title="Ordering">
      <div className={cn('flex items-center gap-x-2')}>
        <Select
          items={orderByitems}
          search={false}
          value={value.value}
          onChange={(v) => {
            onChangeOrdering(v);
          }}
        />

        {orderingDirection && ordering !== 'none' && (
          <Button
            variant="default"
            size={'tall'}
            className={cn('duration-0', orderingDirection === 'desc' ? 'rotate-180 ' : '')}
            prefix={<Sorting />}
            onClick={onClickOrderingDirection}
          />
        )}
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
  {
    label: 'Updated at',
    value: 'updated_at',
  },
];

const GroupByItem = ({
  groupBy,
  onChangeGroupBy,
}: {
  groupBy: LibrarySearchParams['group_by'];
  onChangeGroupBy: (groupBy: LibrarySearchParams['group_by']) => void;
}) => {
  const navigate = useNavigate();

  const value = groupByItems.find((item) => item.value === groupBy) || groupByItems[0];

  return (
    <ItemContainer title="Group by">
      <Select
        items={groupByItems}
        search={false}
        value={value.value}
        onChange={(v) => {
          onChangeGroupBy(v);
        }}
      />
    </ItemContainer>
  );
};
