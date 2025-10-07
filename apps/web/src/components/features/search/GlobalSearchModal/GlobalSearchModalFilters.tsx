import type { AssetType } from '@buster/server-shared/assets';
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/buttons';
import { DateRangePicker } from '@/components/ui/date/DateRangePicker';
import { Dropdown, type DropdownProps, type IDropdownItem } from '@/components/ui/dropdown';
import BarsFilter from '@/components/ui/icons/NucleoIconOutlined/bars-filter';
import Calendar from '@/components/ui/icons/NucleoIconOutlined/calendar';
import Grid2 from '@/components/ui/icons/NucleoIconOutlined/grid-2';
import { Tooltip } from '@/components/ui/tooltip';
import { ASSET_ICONS } from '../../icons/assetIcons';
import type { FiltersParams, OnSetFiltersParams } from './GlobalSearchModal';

export const GlobalSearchModalFilters = React.memo(
  ({ selectedAssets, setSelectedAssets }: FiltersParams & OnSetFiltersParams) => {
    const AssetTypeDropdownItems: IDropdownItem = useMemo(() => {
      return {
        label: 'Asset type',
        value: 'asset-type',
        icon: <Grid2 />,
        selectType: 'multiple',
        items: [
          {
            label: 'Charts',
            value: 'metric_file' satisfies AssetType,
            selected: selectedAssets?.includes('metric_file'),
            icon: <ASSET_ICONS.metrics />,
            onClick: () => setSelectedAssets([...(selectedAssets || []), 'metric_file']),
          },
          {
            label: 'Chats',
            value: 'chat' satisfies AssetType,
            icon: <ASSET_ICONS.chats />,
            onClick: () => setSelectedAssets([...(selectedAssets || []), 'chat']),
          },
          {
            label: 'Reports',
            value: 'report_file' satisfies AssetType,
            icon: <ASSET_ICONS.reports />,
            onClick: () => setSelectedAssets([...(selectedAssets || []), 'report_file']),
          },
          {
            label: 'Dashboards',
            value: 'dashboard_file',
            icon: <ASSET_ICONS.dashboards />,
            onClick: () => setSelectedAssets([...(selectedAssets || []), 'dashboard_file']),
          },
          {
            label: 'Collections',
            value: 'collection' satisfies AssetType,
            icon: <ASSET_ICONS.collections />,
            onClick: () => setSelectedAssets([...(selectedAssets || []), 'collection']),
          },
        ].map((item) => ({
          ...item,
          selected: selectedAssets?.includes(item.value as AssetType),
        })) as IDropdownItem<AssetType>['items'],
      };
    }, [selectedAssets, setSelectedAssets]);

    const DatesDropdownItems: IDropdownItem = useMemo(() => {
      return {
        label: 'Date range',
        value: 'date-range',
        icon: <Calendar />,
        items: [
          <div key="date-range">
            <DateRangePicker />
          </div>,
        ],
      };
    }, []);

    const items: DropdownProps['items'] = [AssetTypeDropdownItems, DatesDropdownItems];

    return (
      <Dropdown
        menuHeader={<div className="px-2.5 py-1.5 text-text-tertiary">Filters...</div>}
        items={items}
      >
        <Tooltip title="Filters">
          <Button variant={'ghost'} prefix={<BarsFilter />} />
        </Tooltip>
      </Dropdown>
    );
  }
);

GlobalSearchModalFilters.displayName = 'GlobalSearchModalFilters';
