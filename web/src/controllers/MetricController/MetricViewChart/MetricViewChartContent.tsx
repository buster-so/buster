import type { BusterMetricData, DataMetadata, IBusterMetric } from '@/api/asset_interfaces/metric';
import { ChartType } from '@/api/asset_interfaces/metric/charts';
import { BusterChart } from '@/components/ui/charts';
import { cn } from '@/lib/classMerge';
import React, { useMemo } from 'react';
import { METRIC_CHART_CONTAINER_ID } from './config';
import { useMount } from '@/hooks';

interface MetricViewChartContentProps {
  className?: string;
  chartConfig: IBusterMetric['chart_config'];
  metricData: BusterMetricData['data'];
  dataMetadata: DataMetadata | undefined;
  fetchedData: boolean;
  errorMessage: string | null | undefined;
  metricId: string;
  readOnly: boolean;
}

export const MetricViewChartContent: React.FC<MetricViewChartContentProps> = React.memo(
  ({
    className,
    chartConfig,
    metricData = null,
    dataMetadata,
    fetchedData,
    errorMessage,
    metricId,
    readOnly
  }) => {
    const columnMetadata = dataMetadata?.column_metadata;
    const isTable = chartConfig?.selectedChartType === ChartType.Table;

    const cardClassName = useMemo(() => {
      if (isTable || !fetchedData) return '';
      return 'p-4';
    }, [isTable, fetchedData]);

    useMount(() => {
      console.log('metricData');
    });

    return (
      <div className={cn('flex h-full flex-col overflow-hidden', cardClassName, className)}>
        <BusterChart
          loading={!fetchedData}
          error={errorMessage || undefined}
          data={metricData}
          columnMetadata={columnMetadata}
          id={METRIC_CHART_CONTAINER_ID(metricId)}
          readOnly={readOnly}
          {...chartConfig}
        />
      </div>
    );
  }
);

MetricViewChartContent.displayName = 'MetricViewChartContent';
