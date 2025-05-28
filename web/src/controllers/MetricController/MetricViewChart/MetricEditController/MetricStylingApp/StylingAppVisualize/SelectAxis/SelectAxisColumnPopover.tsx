import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import type { ChartEncodes, IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { Popover } from '@/components/ui/popover/Popover';
import React from 'react';
import { SelectAxisDropdownContent } from './SelectAxisColumnContent';
import type { SelectAxisContainerId } from './config';

export interface SelectAxisColumnPopoverProps {
  columnLabelFormat: IColumnLabelFormat;
  columnSetting: IBusterMetricChartConfig['columnSettings'][string];
  children: React.ReactNode;
  id: string;
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
  barGroupType: IBusterMetricChartConfig['barGroupType'];
  lineGroupType: IBusterMetricChartConfig['lineGroupType'];
  zoneId: SelectAxisContainerId;
  selectedAxis: ChartEncodes | null;
  rowCount: number;
}

export const SelectAxisColumnPopover = React.memo(
  ({ children, ...props }: SelectAxisColumnPopoverProps) => {
    return (
      <Popover
        side="left"
        align="end"
        size={'none'}
        content={
          <SelectAxisDropdownContent {...props} className="w-full max-w-[315px] min-w-[315px]" />
        }>
        {children}
      </Popover>
    );
  }
);
SelectAxisColumnPopover.displayName = 'SelectAxisColumnPopover';
