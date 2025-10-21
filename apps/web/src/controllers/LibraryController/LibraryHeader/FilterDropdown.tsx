import type { AssetType } from '@buster/server-shared/assets';
import { useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import {
  useGetUserToOrganization,
  useGetUserToOrganizationInfinite,
} from '@/api/buster_rest/users/list';
import { ASSET_ICONS } from '@/components/features/icons/assetIcons';
import { Button } from '@/components/ui/buttons/Button';
import { DateRangePickerContent } from '@/components/ui/date/DateRangePicker';
import {
  createDropdownItem,
  createDropdownItems,
  Dropdown,
  type IDropdownItem,
} from '@/components/ui/dropdown';
import { Calendar } from '@/components/ui/icons';
import BarsFilter from '@/components/ui/icons/NucleoIconOutlined/bars-filter';
import CircleUser from '@/components/ui/icons/NucleoIconOutlined/circle-user';
import Grid2 from '@/components/ui/icons/NucleoIconOutlined/grid-2';
import { Text } from '@/components/ui/typography/Text';
import { useDebounce } from '@/hooks/useDebounce';
import { createDayjsDate, getNow } from '@/lib/date';
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
    const navigate = useNavigate();

    const OwnerDropdownItems = useOwnerDropdownItems({ owner_ids });

    const AssetTypeDropdownItems: IDropdownItem = useMemo(() => {
      return {
        label: 'Asset type',
        value: 'asset-type',
        icon: <Grid2 />,
        selectType: 'multiple',
        items: [
          {
            label: 'Chats',
            value: 'chat' satisfies AssetType,
            icon: <ASSET_ICONS.chats />,
          },
          {
            label: 'Reports',
            value: 'report_file' satisfies AssetType,
            icon: <ASSET_ICONS.reports />,
          },
          {
            label: 'Dashboards',
            value: 'dashboard_file',
            icon: <ASSET_ICONS.dashboards />,
          },
          {
            label: 'Collections',
            value: 'collection' satisfies AssetType,
            icon: <ASSET_ICONS.collections />,
          },
          {
            label: 'Charts',
            value: 'metric_file' satisfies AssetType,
            selected: asset_types?.includes('metric_file'),
            icon: <ASSET_ICONS.metrics />,
          },
        ].map((item) => ({
          ...item,
          selected: asset_types?.includes(item.value as AssetType),
          onClick: () => {
            if (asset_types?.includes(item.value as AssetType)) {
              navigate({
                to: '/app/library',
                search: (prev) => {
                  const newAssetTypes = prev.asset_types?.filter(
                    (v) => v !== (item.value as AssetType)
                  );
                  const hasAssetTypes = newAssetTypes && newAssetTypes.length > 0;
                  return {
                    ...prev,
                    asset_types: hasAssetTypes ? newAssetTypes : undefined,
                  };
                },
              });
            } else {
              navigate({
                to: '/app/library',
                search: (prev) => ({
                  ...prev,
                  asset_types: [...(prev.asset_types || []), item.value as AssetType],
                }),
              });
            }
          },
        })) as IDropdownItem<AssetType>['items'],
      };
    }, [asset_types]);

    const DatesDropdownItems: IDropdownItem = useMemo(() => {
      const closeContent = () => {
        document.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true,
          })
        );
      };

      return createDropdownItem({
        label: 'Date range',
        value: 'date-range',
        icon: <Calendar />,
        className: 'max-h-[400px] w-[620px]',
        closeOnSelect: true,
        items: [
          <DateRangePickerContent
            key="date-range"
            disableDateAfter={getNow().add(12, 'hours').toDate()}
            initialDateFrom={start_date}
            initialDateTo={end_date}
            cancelButtonText="Clear"
            showResetButton={false}
            onUpdate={({ range }) => {
              if (range.from == null && range.to == null) {
                navigate({
                  to: '/app/library',
                  search: (prev) => ({
                    ...prev,
                    start_date: undefined,
                    end_date: undefined,
                  }),
                });
              } else {
                navigate({
                  to: '/app/library',
                  search: (prev) => ({
                    ...prev,
                    start_date: range.from
                      ? dayjs(range.from).startOf('day').toISOString()
                      : dayjs().startOf('day').toISOString(),
                    end_date: range.to ? dayjs(range.to).endOf('day').toISOString() : undefined,
                  }),
                });
              }
              closeContent();
            }}
            onCancel={() => {
              navigate({
                to: '/app/library',
                search: (prev) => ({
                  ...prev,
                  start_date: undefined,
                  end_date: undefined,
                }),
              });
              closeContent();
            }}
          />,
        ],
      });
    }, [start_date, end_date]);

    const dropdownItems = createDropdownItems([
      OwnerDropdownItems,
      AssetTypeDropdownItems,
      DatesDropdownItems,
    ]);

    return (
      <Dropdown
        items={dropdownItems}
        align="end"
        side="bottom"
        menuHeader={<div className="px-2.5 py-1.5 text-text-tertiary">Filters...</div>}
      >
        <Button variant="ghost" prefix={<BarsFilter />} />
      </Dropdown>
    );
  }
);

const useOwnerDropdownItems = ({ owner_ids }: { owner_ids: LibrarySearchParams['owner_ids'] }) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, { wait: 75 });
  const {
    allResults: users,
    isFetching,
    fetchNextPage,
  } = useGetUserToOrganizationInfinite({
    page_size: 20,
    query: debouncedSearch,
  });

  const OwnerDropdownItems: IDropdownItem = useMemo(() => {
    return createDropdownItem({
      label: 'Owner',
      value: 'owner',
      icon: <CircleUser />,
      items: users.map((user) => ({
        label: user.name,
        value: user.id,
        icon: <CircleUser />,
        onClick: () => {
          console.log('clicked', user);
        },
      })),
      selectType: 'multiple',
      menuHeader: 'Search owners by name or email',
      onScrollToBottom: () => {
        console.log('scrolled to bottom');
        fetchNextPage();
      },
      onSearch: (search) => {
        setSearch(search);
      },
      isFetchingNextPage: isFetching,
    });
  }, [owner_ids, users, isFetching, fetchNextPage]);

  return OwnerDropdownItems;
};
