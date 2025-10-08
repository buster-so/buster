import type { AssetType } from '@buster/server-shared/assets';
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/buttons';
import { DateRangePickerContent } from '@/components/ui/date/DateRangePicker';
import {
  createDropdownItem,
  Dropdown,
  type DropdownProps,
  type IDropdownItem,
} from '@/components/ui/dropdown';
import BarsFilter from '@/components/ui/icons/NucleoIconOutlined/bars-filter';
import Calendar from '@/components/ui/icons/NucleoIconOutlined/calendar';
import Grid2 from '@/components/ui/icons/NucleoIconOutlined/grid-2';
import { Tooltip } from '@/components/ui/tooltip';
import { getNow } from '@/lib/date';
import { ASSET_ICONS } from '../../icons/assetIcons';
import type { FiltersParams, OnSetFiltersParams } from './GlobalSearchModal';

export const GlobalSearchModalFilters = React.memo(
  ({
    selectedAssets,
    selectedDateRange,
    setSelectedDateRange,
    setSelectedAssets,
  }: FiltersParams & OnSetFiltersParams) => {
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
          },
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
        ].map((item) => ({
          ...item,
          selected: selectedAssets?.includes(item.value as AssetType),
          onClick: () => {
            console.log(
              'onClick',
              item.value,
              selectedAssets,
              selectedAssets?.includes(item.value as AssetType)
            );
            if (selectedAssets?.includes(item.value as AssetType)) {
              setSelectedAssets(selectedAssets.filter((v) => v !== item.value));
            } else {
              setSelectedAssets([...(selectedAssets || []), item.value as AssetType]);
            }
          },
        })) as IDropdownItem<AssetType>['items'],
      };
    }, [selectedAssets, setSelectedAssets]);

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
            initialDateFrom={selectedDateRange?.from}
            initialDateTo={selectedDateRange?.to}
            cancelButtonText="Clear"
            showResetButton={false}
            onUpdate={({ range }) => {
              if (range.from == null && range.to == null) {
                setSelectedDateRange(null);
              } else {
                setSelectedDateRange({
                  from: range.from ?? new Date(),
                  to: range.to ?? new Date(),
                });
              }
              closeContent();
            }}
            onCancel={() => {
              setSelectedDateRange(null);
              closeContent();
            }}
          />,
        ],
      });
    }, [selectedDateRange, setSelectedDateRange]);

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
