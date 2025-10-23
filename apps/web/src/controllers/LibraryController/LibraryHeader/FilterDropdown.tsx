import type { AssetType } from '@buster/server-shared/assets';
import { useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import {
  useGetUserToOrganization,
  useGetUserToOrganizationInfiniteManual,
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
import { Tooltip } from '@/components/ui/tooltip';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/classMerge';
import { getNow } from '@/lib/date';
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
    const [open, setOpen] = useState(false);

    const OwnerDropdownItems = useOwnerDropdownItems({ owner_ids, open });

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
            value: 'dashboard_file' satisfies AssetType,
            icon: <ASSET_ICONS.dashboards />,
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
            navigate({
              to: '/app/library',
              search: (prev) => {
                const isSelected = asset_types?.includes(item.value as AssetType);
                const newAssetTypes = isSelected
                  ? prev.asset_types?.filter((v) => v !== (item.value as AssetType))
                  : [...(prev.asset_types || []), item.value as AssetType];
                const hasAssetTypes = newAssetTypes && newAssetTypes.length > 0;

                return {
                  ...prev,
                  asset_types: hasAssetTypes ? newAssetTypes : undefined,
                };
              },
            });
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
        onOpenChange={setOpen}
      >
        <Tooltip title="Filters">
          <Button variant="ghost" prefix={<BarsFilter />} />
        </Tooltip>
      </Dropdown>
    );
  }
);

const useOwnerDropdownItems = ({
  owner_ids,
  open,
}: {
  owner_ids: LibrarySearchParams['owner_ids'];
  open: boolean;
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, { wait: 50 });
  const {
    allResults: users,
    isFetching,
    fetchNextPage,
  } = useGetUserToOrganizationInfiniteManual({
    page_size: 20,
    query: debouncedSearch,
    mounted: open,
  });
  const { data: forcedInlucdedUsers } = useGetUserToOrganization(
    { force_include_in_search: owner_ids, page_size: 1000, page: 1 },
    { enabled: !!owner_ids?.length && open }
  );

  const allUsers = useMemo(() => {
    if (search.length > 0) {
      return users;
    }

    // Combine and deduplicate users by id
    const combined = [...(forcedInlucdedUsers?.data || []), ...users];
    const deduplicated = Array.from(new Map(combined.map((user) => [user.id, user])).values());

    // Sort: selected users first, then alphabetically by name
    return deduplicated.sort((a, b) => {
      const aSelected = owner_ids?.includes(a.id) ?? false;
      const bSelected = owner_ids?.includes(b.id) ?? false;

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // Both selected or both not selected, sort by name
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [forcedInlucdedUsers?.data, users, owner_ids, !!search]);

  const OwnerDropdownItems: IDropdownItem = useMemo(() => {
    const avatarClassName = 'w-6 h-6 rounded-full bg-gray-light/30';
    return createDropdownItem({
      label: 'Owner',
      value: 'owner',
      icon: <CircleUser />,
      items: allUsers.map((user) => ({
        label: (
          <div className="flex gap-1.5 items-center justify-start">
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt={user.name || user.email} className={avatarClassName} />
            )}
            {!user.avatarUrl && <div className={cn(avatarClassName)} />}
            <div className="flex flex-col gap-0">
              <div className="text-text-default">{user.name}</div>
              <div className="text-text-secondary">{user.email}</div>
            </div>
          </div>
        ),
        value: user.id,
        selected: owner_ids?.includes(user.id),
        onClick: () => {
          navigate({
            to: '/app/library',
            search: (prev) => {
              const isSelected = prev.owner_ids?.includes(user.id);
              const owner_ids = isSelected
                ? prev.owner_ids?.filter((v) => v !== user.id) || []
                : [...(prev.owner_ids || []), user.id];
              const hasOwnerIds = owner_ids && owner_ids.length > 0;
              return {
                ...prev,
                owner_ids: hasOwnerIds ? owner_ids : undefined,
              };
            },
          });
        },
      })),
      emptyStateText: 'No owners found',
      selectType: 'multiple',
      menuHeader: 'Search owners by name or email',
      onScrollToBottom: () => fetchNextPage(),
      onSearch: setSearch,
      isFetchingNextPage: isFetching,
      className: 'min-w-[245px]',
    });
  }, [owner_ids, allUsers, isFetching, fetchNextPage]);

  return OwnerDropdownItems;
};
