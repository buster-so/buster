'use client';

import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { DataContainer } from '@/components/features/layouts/AppVerticalCodeSplitter';
import { useLocalStorageState, useMemoizedFn } from '@/hooks';
import React, { useMemo } from 'react';

export const MetricViewResultsController = React.memo(({ metricId }: { metricId: string }) => {
  const { isFetched: isFetchedMetric } = useGetMetric(
    { id: metricId },
    {
      select: ({ sql, data_source_id }) => ({
        sql,
        data_source_id
      })
    }
  );
  const { data: metricData, isFetched: isFetchedInitialData } = useGetMetricData(
    { id: metricId },
    { enabled: false }
  );

  const localStorageKey = useMemo(() => {
    const key = `m-results-widths-${metricId}`;
    const maxNumberOfCharacters = 512;
    return key.slice(0, maxNumberOfCharacters);
  }, [metricId]);

  const [columnWidths, setColumnWidths] = useLocalStorageState<Record<string, number>>(
    localStorageKey,
    { defaultValue: {} }
  );

  const fetchintData = !isFetchedMetric || !isFetchedInitialData;

  const onResizeColumns = useMemoizedFn((columnSizes: { key: string; size: number }[]) => {
    console.log('columnSizes', localStorageKey, columnSizes);
    setColumnWidths(
      columnSizes.reduce(
        (acc, curr) => {
          acc[curr.key] = curr.size;
          return acc;
        },
        {} as Record<string, number>
      )
    );
  });

  return (
    <div className="h-full w-full p-5">
      <DataContainer
        data={metricData?.data || null}
        fetchingData={fetchintData}
        columnWidths={columnWidths}
        onResizeColumns={onResizeColumns}
      />
    </div>
  );
});

MetricViewResultsController.displayName = 'MetricViewResultsController';
