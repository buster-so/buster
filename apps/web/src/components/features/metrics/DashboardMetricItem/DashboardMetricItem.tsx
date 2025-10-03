import React, { useCallback, useContext, useRef } from 'react';
import type { BusterMetricData } from '@/api/asset_interfaces/metric';
import { useGetMetricData } from '@/api/buster_rest/metrics';
import { MetricChartCard } from '@/components/features/metrics/MetricChartCard';
import { SortableItemContext } from '@/components/ui/grid/SortableItemContext';
import { useHasBeenInViewport } from '@/hooks/useInViewport';
import { DashboardMetricItemThreeDotMenu } from './DashboardMetricItemThreeDotMenu';

interface DashboardMetricItemBaseProps {
  metricId: string;
  metricVersionNumber: number | undefined;
  dashboardVersionNumber: number | undefined;
  dashboardId: string;
  numberOfMetrics: number;
  className?: string;
  isDragOverlay?: boolean;
  animate?: boolean;
  readOnly?: boolean;
}

export const DashboardMetricItem: React.FC<DashboardMetricItemBaseProps> = React.memo(
  ({
    dashboardId,
    animate: animateProp = true,
    metricVersionNumber,
    metricId,
    isDragOverlay = false,
    numberOfMetrics,
    readOnly = false,
    dashboardVersionNumber,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const hasBeenInViewport = useHasBeenInViewport(containerRef, {
      threshold: 0.25,
    });
    const { data: dataLength = 0 } = useGetMetricData(
      { id: metricId, versionNumber: metricVersionNumber, filterValues: undefined },
      { select: useCallback((data: BusterMetricData) => data.data?.length || 0, []) }
    );
    const animate = !isDragOverlay && dataLength < 125 && numberOfMetrics <= 30 && animateProp;

    const { attributes, listeners } = useContext(SortableItemContext);

    return (
      <MetricChartCard
        ref={containerRef}
        attributes={attributes}
        listeners={listeners}
        readOnly
        metricId={metricId}
        versionNumber={metricVersionNumber}
        animate={animate}
        useHeaderLink={!readOnly}
        renderChartContent={hasBeenInViewport}
        disableTooltip={isDragOverlay}
        headerSecondaryContent={
          !isDragOverlay &&
          !readOnly && (
            <DashboardMetricItemThreeDotMenu
              metricId={metricId}
              metricVersionNumber={metricVersionNumber}
              dashboardId={dashboardId}
              dashboardVersionNumber={dashboardVersionNumber}
            />
          )
        }
      />
    );
  }
);
