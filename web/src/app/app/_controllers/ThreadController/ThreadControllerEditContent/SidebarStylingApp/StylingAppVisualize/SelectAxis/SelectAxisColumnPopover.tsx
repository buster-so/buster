import React from 'react';
import { AppPopover } from '@/components';
import { ChartEncodes, IColumnLabelFormat } from '@/components/charts';
import { SelectAxisDropdownContent } from './SelectAxisColumnContent';
import { IBusterThreadMessageChartConfig } from '@/api/buster-rest';
import { SelectAxisContainerId } from './config';

interface SelectAxisColumnPopoverProps {
  columnLabelFormat: IColumnLabelFormat;
  columnSetting: IBusterThreadMessageChartConfig['columnSettings'][string];
  children: React.ReactNode;
  id: string;
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  barGroupType: IBusterThreadMessageChartConfig['barGroupType'];
  lineGroupType: IBusterThreadMessageChartConfig['lineGroupType'];
  zoneId: SelectAxisContainerId;
  selectedAxis: ChartEncodes | null;
}

export const SelectAxisColumnPopover = React.memo(
  ({ children, ...props }: SelectAxisColumnPopoverProps) => {
    return (
      <AppPopover
        trigger="click"
        performant
        destroyTooltipOnHide
        placement="leftBottom"
        content={
          <SelectAxisDropdownContent {...props} className="w-full min-w-[315px] max-w-[315px]" />
        }>
        {children}
      </AppPopover>
    );
  }
);
SelectAxisColumnPopover.displayName = 'SelectAxisColumnPopover';
