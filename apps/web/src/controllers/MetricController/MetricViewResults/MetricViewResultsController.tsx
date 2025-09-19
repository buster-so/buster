import React, { useCallback, useMemo } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { DataContainer } from '@/components/ui/layouts/AppVerticalCodeSplitter/DataContainer';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const MetricViewResultsController = React.memo(
  ({
    metricId,
    versionNumber,
    cacheId,
  }: {
    metricId: string;
    versionNumber: number | undefined;
    cacheId?: string;
  }) => {
    const { isFetched: isFetchedMetric } = useGetMetric(
      { id: metricId, versionNumber, cacheId },
      {
        select: useCallback(
          ({ sql, data_source_id }: BusterMetric) => ({
            sql,
            data_source_id,
          }),
          []
        ),
      }
    );
    const { data: metricData, isFetched: isFetchedInitialData } = useGetMetricData(
      { id: metricId, versionNumber, cacheId },
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
  }
);

MetricViewResultsController.displayName = 'MetricViewResultsController';
