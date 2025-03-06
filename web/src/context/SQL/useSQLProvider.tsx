import React, { useRef, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { useBusterMetricsIndividualContextSelector } from '../Metrics';
import { createContext, useContextSelector } from 'use-context-selector';
import { useBusterNotifications } from '../BusterNotifications';
import { didColumnDataChange, simplifyChatConfigForSQLChange } from './helpers';
import { type IBusterMetricChartConfig, type RunSQLResponse } from '@/api/asset_interfaces';
import { queryKeys } from '@/api/query_keys';
import { MetricUpdateMetric } from '@/api/buster_socket/metrics';
import { runSQL as runSQLRest } from '@/api/buster_rest';
import { BusterMetricData } from '../MetricData';
import { useQueryClient } from '@tanstack/react-query';

export const useSQLProvider = () => {
  const queryClient = useQueryClient();
  const { openSuccessNotification } = useBusterNotifications();
  const onUpdateMetric = useBusterMetricsIndividualContextSelector((x) => x.onUpdateMetric);
  const updateMetricMutation = useBusterMetricsIndividualContextSelector(
    (x) => x.updateMetricMutation
  );
  const getMetricMemoized = useBusterMetricsIndividualContextSelector((x) => x.getMetricMemoized);
  const onSaveMetricChanges = useBusterMetricsIndividualContextSelector(
    (x) => x.onSaveMetricChanges
  );

  const [warnBeforeNavigating, setWarnBeforeNavigating] = useState(false);

  const getDataByMetricIdMemoized = useMemoizedFn(
    (metricId: string): BusterMetricData | undefined => {
      const options = queryKeys.metricsGetDataByMessageId(metricId);
      const metricData = queryClient.getQueryData(options.queryKey);
      return metricData;
    }
  );

  const originalConfigs = useRef<
    Record<
      string,
      {
        chartConfig: IBusterMetricChartConfig;
        code: string;
        data: BusterMetricData['data'];
        dataMetadata: BusterMetricData['data_metadata'];
      }
    >
  >({});

  const onSetDataForMetric = ({
    metricId,
    data,
    data_metadata,
    code,
    isDataFromRerun
  }: {
    metricId: string;
    data: BusterMetricData['data'];
    data_metadata: BusterMetricData['data_metadata'];
    code: string;
    isDataFromRerun: boolean;
  }) => {
    const options = queryKeys.metricsGetDataByMessageId(metricId);
    const currentData = getDataByMetricIdMemoized(metricId);
    const setter = isDataFromRerun ? 'dataFromRerun' : 'data';
    queryClient.setQueryData(options.queryKey, {
      ...currentData!,
      [setter]: data,
      data_metadata,
      code
    });
  };

  const _onResponseRunSQL = useMemoizedFn(
    (d: RunSQLResponse, sql: string, { metricId }: { metricId?: string }) => {
      if (metricId) {
        const { data, data_metadata } = d;
        const metricMessage = getMetricMemoized({ metricId });
        const currentMessageData = getDataByMetricIdMemoized(metricId);
        if (!originalConfigs.current[metricId]) {
          originalConfigs.current[metricId] = {
            chartConfig: metricMessage?.chart_config!,
            code: currentMessageData?.code!,
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
          data_metadata,
          code: sql
        });
        onUpdateMetric({
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
      try {
        const result = await runSQLRest({
          data_source_id: dataSourceId,
          sql
        });

        _onResponseRunSQL(result, sql, { metricId });

        return result;
      } catch (error) {
        //
      }
    }
  );

  const resetRunSQLData = useMemoizedFn(({ metricId }: { metricId: string }) => {
    setWarnBeforeNavigating(false);

    if (!originalConfigs.current[metricId]) return;
    const oldConfig = originalConfigs.current[metricId]?.chartConfig;
    onUpdateMetric({
      id: metricId,
      chart_config: oldConfig
    });
    onSetDataForMetric({
      metricId,
      data: originalConfigs.current[metricId]?.data!,
      data_metadata: originalConfigs.current[metricId]?.dataMetadata!,
      code: originalConfigs.current[metricId]?.code!,
      isDataFromRerun: false
    });
    delete originalConfigs.current[metricId];
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
      const ogConfigs = originalConfigs.current[metricId];
      const currentMetric = getMetricMemoized({ metricId });
      const dataSourceId = dataSourceIdProp || currentMetric?.data_source_id;

      if ((!ogConfigs || ogConfigs.code !== sql) && dataSourceId) {
        try {
          await runSQL({
            metricId,
            sql: sql,
            dataSourceId
          });
        } catch (error) {
          throw error;
        }
      }

      const payload: MetricUpdateMetric['payload'] = {
        id: metricId,
        sql: sql
      };

      await updateMetricMutation(payload);
      await onSaveMetricChanges({
        metricId,
        save_draft: true,
        save_as_metric_state: metricId
      });

      setWarnBeforeNavigating(false);

      if (originalConfigs.current[metricId]) {
        onSetDataForMetric({
          metricId,
          data: originalConfigs.current[metricId]?.data!,
          data_metadata: originalConfigs.current[metricId]?.dataMetadata!,
          code: originalConfigs.current[metricId]?.code!,
          isDataFromRerun: false
        });
      }

      setTimeout(() => {
        openSuccessNotification({
          title: 'SQL Saved',
          message: 'Your changes have been saved.'
        });
      }, 120);

      delete originalConfigs.current[metricId];
    }
  );

  return {
    runSQL,
    resetRunSQLData,
    warnBeforeNavigating,
    setWarnBeforeNavigating,
    saveSQL
  };
};

const BusterSQL = createContext<ReturnType<typeof useSQLProvider>>(
  {} as ReturnType<typeof useSQLProvider>
);

export const BusterSQLProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <BusterSQL.Provider value={useSQLProvider()}>{children}</BusterSQL.Provider>;
};

export const useSQLContextSelector = <T,>(
  selector: (state: ReturnType<typeof useSQLProvider>) => T
) => useContextSelector(BusterSQL, selector);
