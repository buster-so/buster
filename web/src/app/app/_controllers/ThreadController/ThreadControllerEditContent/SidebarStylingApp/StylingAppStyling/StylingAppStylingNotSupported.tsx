import { IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import { ChartType } from '@/components/charts';
import React, { useMemo } from 'react';
import { Text } from '@/components/text';

export const StylingAppStylingNotSupported = React.memo(
  ({
    selectedChartType
  }: {
    selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  }) => {
    const title = useMemo(() => {
      if (selectedChartType === ChartType.Table) {
        return 'Styling for tables charts is coming soon';
      }
      if (selectedChartType === ChartType.Metric) {
        return 'Styling for metric charts is coming soon';
      }
      return '';
    }, [selectedChartType]);

    return (
      <div className="flex h-full w-full items-center justify-center p-5">
        <Text type="secondary" className="text-center">
          {title}
        </Text>
      </div>
    );
  }
);
StylingAppStylingNotSupported.displayName = 'StylingAppStylingNotSupported';
