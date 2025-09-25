import React from 'react';
import { MetricHeaderSecondaryWrapperDropdown } from '../MetricHeaderSecondaryWrapper';
import { useDashboardMetricCardThreeDotMenuItems } from './useDashboardMetricCardThreeDotMenuItems';

export const DashboardMetricItemThreeDotMenu = React.memo(
  ({
    metricId,
    metricVersionNumber,
    dashboardId,
    dashboardVersionNumber,
  }: {
    metricId: string;
    metricVersionNumber: number | undefined;
    dashboardId: string;
    dashboardVersionNumber: number | undefined;
  }) => {
    const threeDotMenuItems = useDashboardMetricCardThreeDotMenuItems({
      dashboardId,
      metricId,
      metricVersionNumber,
      dashboardVersionNumber,
    });

    return <MetricHeaderSecondaryWrapperDropdown dropdownItems={threeDotMenuItems} />;
  }
);
