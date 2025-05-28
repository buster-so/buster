import type { BusterMetricData, IBusterMetricChartConfig } from '@/api/asset_interfaces/metric';
import type { RunSQLResponse } from '@/api/asset_interfaces/sql';
import { useRunSQL as useRunSQLQuery } from '@/api/buster_rest';
import { useGetLatestMetricVersionMemoized, useUpdateMetric } from '@/api/buster_rest/metrics';
import { queryKeys } from '@/api/query_keys';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useGetMetricDataMemoized, useGetMetricMemoized } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';
import { timeout } from '@/lib';
import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { didColumnDataChange, simplifyChatConfigForSQLChange } from './helpers';

export const useMetricRunSQL = () => {
  const queryClient = useQueryClient();
  const getMetricMemoized = useGetMetricMemoized();
  const getMetricDataMemoized = useGetMetricDataMemoized();
  const { mutateAsync: stageMetric } = useUpdateMetric({
    updateVersion: false,
    saveToServer: false,
    updateOnSave: false
  });
  const {
    mutateAsync: saveMetric,
    error: saveMetricError,
    isPending: isSavingMetric
  } = useUpdateMetric({
    updateOnSave: true,
    updateVersion: true,
    saveToServer: true
  });
  const {
    mutateAsync: runSQLMutation,
    error: runSQLError,
    isPending: isRunningSQL
  } = useRunSQLQuery();
  const { openSuccessNotification } = useBusterNotifications();
  const getLatestMetricVersion = useGetLatestMetricVersionMemoized();

  const originalConfigs = useRef<{
    chartConfig: IBusterMetricChartConfig;
    sql: string;
    data: BusterMetricData['data'];
    dataMetadata: BusterMetricData['data_metadata'];
  } | null>(null);

  const onSetDataForMetric = ({
    metricId,
    data,
    data_metadata,
    isDataFromRerun
  }: {
    metricId: string;
    data: BusterMetricData['data'];
    data_metadata: BusterMetricData['data_metadata'];
    isDataFromRerun: boolean;
  }) => {
    const latestVersionNumber = getLatestMetricVersion(metricId);
    const options = queryKeys.metricsGetData(metricId, latestVersionNumber as number);
    const currentData = getMetricDataMemoized(metricId, latestVersionNumber as number);
    if (!currentData) return;
    const setter = isDataFromRerun ? 'dataFromRerun' : 'data';

    queryClient.setQueryData(options.queryKey, {
      ...currentData,
      [setter]: data,
      data_metadata,
      ...(!isDataFromRerun && { dataFromRerun: undefined })
    });
  };

  const onResponseRunSQL = useMemoizedFn(
    (d: RunSQLResponse, sql: string, { metricId }: { metricId?: string }) => {
      if (metricId) {
        const { data, data_metadata } = d;
        const metricMessage = getMetricMemoized(metricId);
        const currentMessageData = getMetricDataMemoized(metricId);
        if (!originalConfigs.current) {
          originalConfigs.current = {
            chartConfig: metricMessage?.chart_config!,
            sql: metricMessage?.sql!,
            data: currentMessageData?.data!,
            dataMetadata: currentMessageData?.data_metadata!
          };
        }

        const oldColumnData = metricMessage.data_metadata?.column_metadata;
        const newColumnData = data_metadata?.column_metadata;

        const didDataMetadataChange = didColumnDataChange(oldColumnData, newColumnData);
        const totallyDefaultChartConfig: IBusterMetricChartConfig = didDataMetadataChange
          ? simplifyChatConfigForSQLChange(metricMessage.chart_config, data_metadata)
          : metricMessage.chart_config;

        onSetDataForMetric({
          metricId,
          data,
          isDataFromRerun: true,
          data_metadata
        });
        stageMetric({
          id: metricId,
          chart_config: totallyDefaultChartConfig
        });
      }

      return d;
    }
  );

  const runSQL = useMemoizedFn(
    async ({
      dataSourceId,
      sql,
      metricId
    }: {
      dataSourceId: string;
      metricId?: string;
      sql: string;
    }) => {
      const result = await runSQLMutation({
        data_source_id: dataSourceId,
        sql
      });
      onResponseRunSQL(result, sql, { metricId });
      return result;
    }
  );

  const resetRunSQLData = useMemoizedFn(({ metricId }: { metricId: string }) => {
    if (!originalConfigs.current) return;
    const oldConfig = originalConfigs.current?.chartConfig;
    stageMetric({
      id: metricId,
      chart_config: oldConfig
    });
    onSetDataForMetric({
      metricId,
      data: originalConfigs.current?.data!,
      data_metadata: originalConfigs.current?.dataMetadata!,
      isDataFromRerun: false
    });
    originalConfigs.current = null;
  });

  const saveSQL = useMemoizedFn(
    async ({
      metricId,
      sql,
      dataSourceId: dataSourceIdProp
    }: {
      metricId: string;
      sql: string;
      dataSourceId?: string;
    }) => {
      const currentMetric = getMetricMemoized(metricId);
      const dataSourceId = dataSourceIdProp || currentMetric?.data_source_id;

      if (!originalConfigs.current || originalConfigs.current.sql !== sql) {
        await runSQL({
          metricId,
          sql: sql,
          dataSourceId
        });
      }
      await timeout(50);

      const currentChartConfig = getMetricMemoized(metricId)?.chart_config; //grab it like this because we need the reset based on stageMetric function
      await saveMetric({
        id: metricId,
        sql,
        chart_config: currentChartConfig //this is reset based on stageMetric function
      });
      await timeout(50);

      const latestVersionNumber = getLatestMetricVersion(metricId);
      const currentData = getMetricDataMemoized(metricId, latestVersionNumber as number);

      if (currentData?.data_metadata && currentData?.dataFromRerun) {
        onSetDataForMetric({
          metricId,
          data: currentData?.dataFromRerun,
          data_metadata: currentData?.data_metadata,
          isDataFromRerun: false
        });
      }

      setTimeout(() => {
        openSuccessNotification({
          title: 'SQL Saved',
          message: 'Your changes have been saved.'
        });
      }, 50);

      originalConfigs.current = null;
    }
  );

  return {
    runSQL,
    resetRunSQLData,
    saveSQL,
    saveMetricError: saveMetricError?.message,
    runSQLError: runSQLError?.message,
    isSavingMetric,
    isRunningSQL
  };
};
