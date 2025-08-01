'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { DataResult } from '@buster/server-shared/metrics';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { AppVerticalCodeSplitter } from '@/components/features/layouts/AppVerticalCodeSplitter';
import type { AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { useMemoizedFn } from '@/hooks';
import { useMetricResultsLayout } from './useMetricResultsLayout';
import { useMetricRunSQL } from './useMetricRunSQL';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';

export const MetricViewSQLController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  const appSplitterRef = React.useRef<AppSplitterRef>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const autoSaveId = `view-sql-${metricId}`;

  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);

  const {
    runSQL,
    resetRunSQLData,
    saveSQL,
    saveMetricError,
    runSQLError,
    isSavingMetric,
    isRunningSQL
  } = useMetricRunSQL();

  const { data: metric } = useGetMetric(
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

  const [sql, setSQL] = useState(metric?.sql || '');

  const dataSourceId = metric?.data_source_id || '';
  const data: DataResult | null = metricData?.dataFromRerun || metricData?.data || null;

  const disableSave = useMemo(() => {
    return !sql || isRunningSQL || sql === metric?.sql;
  }, [sql, isRunningSQL, metric?.sql]);

  const onRunQuery = useMemoizedFn(async () => {
    try {
      const res = await runSQL({
        dataSourceId,
        sql,
        metricId
      });

      if (res?.data && res.data.length > 0) {
        const data = res.data;
        const headerHeight = 28.1;
        const heightOfRow = 28.1;
        const heightOfDataContainer = headerHeight + heightOfRow * (data.length || 0);
        const containerHeight = containerRef.current?.clientHeight || 0;
        const maxHeight = Math.floor(containerHeight * 0.6);
        const finalHeight = Math.min(heightOfDataContainer, maxHeight) + 12;
        appSplitterRef.current?.setSplitSizes(['auto', `${finalHeight}px`]);
      }
    } catch (error) {
      //
    }
  });

  const onSaveSQL = useMemoizedFn(async () => {
    await saveSQL({
      metricId,
      sql,
      dataSourceId
    });
  });

  const { defaultLayout } = useMetricResultsLayout({
    appSplitterRef,
    autoSaveId
  });

  useEffect(() => {
    if (metric?.sql) {
      setSQL(metric.sql);
    }
  }, [metric?.sql]);

  return (
    <div ref={containerRef} className="h-full w-full p-5">
      <AppVerticalCodeSplitter
        ref={appSplitterRef}
        autoSaveId={autoSaveId}
        sql={sql}
        setSQL={setSQL}
        runSQLError={runSQLError || saveMetricError}
        onRunQuery={onRunQuery}
        onSaveSQL={onSaveSQL}
        data={data || []}
        readOnly={isVersionHistoryMode}
        disabledSave={disableSave}
        fetchingData={isRunningSQL || isSavingMetric || !isFetchedInitialData}
        defaultLayout={defaultLayout}
        topHidden={false}
      />
    </div>
  );
});

MetricViewSQLController.displayName = 'MetricViewSQLController';
