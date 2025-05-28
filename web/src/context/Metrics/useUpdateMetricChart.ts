'use client';

import {
  type ColumnSettings,
  DEFAULT_CHART_CONFIG,
  type IColumnLabelFormat,
  type IBusterMetricChartConfig
} from '@/api/asset_interfaces/metric';
import { useSaveMetric, useUpdateMetric } from '@/api/buster_rest/metrics';
import { useMemoizedFn } from '@/hooks';
import { useGetMetricMemoized } from './useGetMetricMemoized';
import { useParams } from 'next/navigation';
import { timeout } from '@/lib/timeout';
import { useState } from 'react';
import { useOriginalMetricStore } from './useOriginalMetricStore';

export const useUpdateMetricChart = (props?: { metricId?: string; chatId?: string }) => {
  const params = useParams<{ metricId?: string; chatId?: string }>();
  const metricId = props?.metricId ?? params.metricId ?? '';
  const chatId = props?.chatId ?? params.chatId ?? '';
  const [isSaving, setIsSaving] = useState(false);
  const getOriginalMetric = useOriginalMetricStore((x) => x.getOriginalMetric);
  const setOriginalMetric = useOriginalMetricStore((x) => x.setOriginalMetric);
  const { mutate: onUpdateMetric } = useUpdateMetric({
    updateVersion: false,
    updateOnSave: false,
    saveToServer: false
  });
  const { mutateAsync: saveMetricToServer } = useUpdateMetric({
    updateOnSave: true,
    saveToServer: true,
    updateVersion: !chatId
  });

  const getMetricMemoized = useGetMetricMemoized();

  const onUpdateMetricChartConfig = useMemoizedFn(
    ({
      chartConfig,
      ignoreUndoRedo
    }: {
      chartConfig: Partial<IBusterMetricChartConfig>;
      ignoreUndoRedo?: boolean;
    }) => {
      const currentMetric = getMetricMemoized(metricId);

      if (!ignoreUndoRedo) {
        // undoRedoParams.addToUndoStack({
        //   metricId: editMetric.id,
        //   messageId: editMessage.id,
        //   chartConfig: editMessage.chart_config
        // });
      }

      const newChartConfig: IBusterMetricChartConfig = {
        ...DEFAULT_CHART_CONFIG,
        ...currentMetric.chart_config,
        ...chartConfig
      };

      onUpdateMetric({
        id: metricId,
        chart_config: newChartConfig
      });
    }
  );

  const onUpdateColumnLabelFormat = useMemoizedFn(
    ({
      columnId,
      columnLabelFormat
    }: {
      columnId: string;
      columnLabelFormat: Partial<IColumnLabelFormat>;
    }) => {
      const currentMetric = getMetricMemoized(metricId);
      const existingColumnLabelFormats = currentMetric.chart_config.columnLabelFormats;
      const existingColumnLabelFormat = existingColumnLabelFormats[columnId];
      const newColumnLabelFormat = {
        ...existingColumnLabelFormat,
        ...columnLabelFormat
      };
      const columnLabelFormats = {
        ...existingColumnLabelFormats,
        [columnId]: newColumnLabelFormat
      };
      onUpdateMetricChartConfig({
        chartConfig: {
          columnLabelFormats
        }
      });
    }
  );

  const onUpdateColumnSetting = useMemoizedFn(
    ({ columnId, columnSetting }: { columnId: string; columnSetting: Partial<ColumnSettings> }) => {
      const currentMetric = getMetricMemoized(metricId);
      const existingColumnSettings = currentMetric.chart_config.columnSettings;
      const existingColumnSetting = currentMetric.chart_config.columnSettings[columnId];
      const newColumnSetting: Required<ColumnSettings> = {
        ...existingColumnSetting,
        ...columnSetting
      };
      const newColumnSettings: Record<string, Required<ColumnSettings>> = {
        ...existingColumnSettings,
        [columnId]: newColumnSetting
      };
      onUpdateMetricChartConfig({
        chartConfig: {
          columnSettings: newColumnSettings
        }
      });
    }
  );

  const onUpdateMetricName = useMemoizedFn(({ name }: { name?: string }) => {
    onUpdateMetric({
      id: metricId,
      name
    });
  });

  const onSaveMetricToServer = useMemoizedFn(async () => {
    setIsSaving(true);
    const currentMetric = getMetricMemoized(metricId);
    if (currentMetric) await saveMetricToServer(currentMetric);
    await timeout(350);
    setIsSaving(false);
  });

  const onInitializeTableColumnWidths = useMemoizedFn(
    (tableColumnWidths: IBusterMetricChartConfig['tableColumnWidths']) => {
      const originalMetric = getOriginalMetric(metricId);
      if (originalMetric) {
        const newChartConfig: IBusterMetricChartConfig = {
          ...DEFAULT_CHART_CONFIG,
          ...originalMetric.chart_config,
          tableColumnWidths
        };

        setOriginalMetric({
          ...originalMetric,
          chart_config: newChartConfig
        });
      }
    }
  );

  return {
    onSaveMetricToServer,
    onUpdateMetricChartConfig,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    onUpdateMetricName,
    onInitializeTableColumnWidths,
    isSaving
  };
};
