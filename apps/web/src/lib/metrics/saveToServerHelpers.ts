import type { DataMetadata } from '@buster/server-shared/metrics';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import type { updateMetric } from '@/api/buster_rest/metrics';
import { getChangedValues } from '@/lib/objects';
import { createDefaultChartConfig } from './messageAutoChartHandler';

export const getChangedTopLevelMessageValues = (
  newMetric: BusterMetric,
  oldMetric: BusterMetric
) => {
  const changes = getChangedValues(oldMetric, newMetric, ['name', 'status', 'sql', 'file']);
  return changes;
};

export const combineChangeFromDefaultChartConfig = (
  newMetric: BusterMetric,
  dataMetadata: DataMetadata
) => {
  return createDefaultChartConfig({
    chart_config: newMetric.chart_config,
    data_metadata: dataMetadata,
  });
};

export const prepareMetricUpdateMetric = (
  newMetric: BusterMetric,
  prevMetric: BusterMetric
): Parameters<typeof updateMetric>[0] => {
  const changedTopLevelValues = getChangedTopLevelMessageValues(
    newMetric,
    prevMetric
  ) as unknown as Parameters<typeof updateMetric>[0];
  const dataMetadata = prevMetric.data_metadata;

  const changedChartConfig = combineChangeFromDefaultChartConfig(newMetric, dataMetadata);

  return {
    ...changedTopLevelValues,
    chart_config: changedChartConfig,
    id: newMetric.id,
  };
};
