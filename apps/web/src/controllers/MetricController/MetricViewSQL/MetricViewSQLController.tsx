import type { DataResult } from '@buster/server-shared/metrics';
import React, { useCallback, useEffect, useState } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import type { AppSplitterRef, LayoutSize } from '@/components/ui/layouts/AppSplitter';
import { AppVerticalCodeSplitter } from '@/components/ui/layouts/AppVerticalCodeSplitter';
import { useChatIsVersionHistoryMode } from '@/context/Chats/useIsVersionHistoryMode';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useMetricResultsLayout } from './useMetricResultsLayout';
import { useMetricRunSQL } from './useMetricRunSQL';
import { useViewSQLBlocker } from './useViewSQLBlocker';

export const MetricViewSQLController: React.FC<{
  metricId: string;
  versionNumber: number | undefined;
  cacheId?: string;
  initialLayout: LayoutSize | null;
}> = React.memo(({ metricId, versionNumber, initialLayout, cacheId }) => {
  const appSplitterRef = React.useRef<AppSplitterRef>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const autoSaveId = `view-sql-${metricId}`;

  const isVersionHistoryMode = useChatIsVersionHistoryMode({ type: 'metric_file' });

  const {
    runSQL,
    resetRunSQLData,
    saveSQL,
    saveMetricError,
    runSQLError,
    isSavingMetric,
    isRunningSQL,
  } = useMetricRunSQL();

  const { data: metric, isFetched: isFetchedMetric } = useGetMetric(
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

  const [sql, setSQL] = useState(metric?.sql || '');

  const isSQLChanged = sql !== metric?.sql;
  const disableSave = !sql || isRunningSQL || isSQLChanged;
  const dataSourceId = metric?.data_source_id || '';
  const data: DataResult | null = metricData?.dataFromRerun || metricData?.data || null;

  const onRunQuery = useMemoizedFn(async () => {
    try {
      const res = await runSQL({
        dataSourceId,
        sql,
        metricId,
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
      dataSourceId,
    });
  });

  const onResetToOriginal = useMemoizedFn(async () => {
    setSQL(metric?.sql || '');
    resetRunSQLData({ metricId });
  });

  const { defaultLayout } = useMetricResultsLayout({
    appSplitterRef,
    autoSaveId,
  });

  useEffect(() => {
    if (metric?.sql) {
      setSQL(metric.sql);
    }
  }, [metric?.sql]);

  useViewSQLBlocker({ sql, originalSql: metric?.sql, enabled: isFetchedMetric, onResetToOriginal });

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
        initialLayout={initialLayout}
      />
    </div>
  );
});

MetricViewSQLController.displayName = 'MetricViewSQLController';
