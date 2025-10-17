import React, { useMemo } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Sliders3 } from '@/components/ui/icons/NucleoIconOutlined';
import GridLayoutRows from '@/components/ui/icons/NucleoIconOutlined/grid-layout-rows';
import UnorderedList from '@/components/ui/icons/NucleoIconOutlined/unordered-list';
import { Popover } from '@/components/ui/popover';
import { AppSegmented, createSegmentedItems } from '@/components/ui/segmented';
import { Text } from '@/components/ui/typography/Text';
import { setLibraryLayoutCookie } from '@/context/Library/useLibraryLayout';
import type { LibraryLayout, LibrarySearchParams } from '../schema';

export const OrderDropdown = React.memo(
  ({
    layout,
    ordering,
    groupBy,
  }: {
    layout: LibraryLayout;
    ordering: LibrarySearchParams['ordering'];
    groupBy: LibrarySearchParams['group_by'];
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
              <OrderingItem ordering={ordering} />
              <GroupByItem groupBy={groupBy} />
            </div>
          ),
          [layout, ordering, groupBy]
        )}
      >
        <Button variant="ghost" prefix={<Sliders3 />} onClick={() => {}} />
      </Popover>
    );
  }
);

OrderDropdown.displayName = 'OrderDropdown';

const ItemContainer = ({ children, title }: { children: React.ReactNode; title: string }) => {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-x-2">
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

const OrderingItem = ({ ordering }: { ordering: LibrarySearchParams['ordering'] }) => {
  return <ItemContainer title="Ordering">asdf</ItemContainer>;
};

const GroupByItem = ({ groupBy }: { groupBy: LibrarySearchParams['group_by'] }) => {
  return <ItemContainer title="Group by">asdf</ItemContainer>;
};
