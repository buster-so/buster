import React, { PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMemoizedFn } from 'ahooks';
import type { IBusterMetric } from '../interfaces';
import { resolveEmptyMetric } from '../helpers';
import { useUpdateMetricConfig } from './useMetricUpdateConfig';
import { useUpdateMetricAssosciations } from './useMetricUpdateAssosciations';
import { useShareMetric } from './useMetricShare';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { useMetricDelete } from './useMetricDelete';

const useBusterMetricsIndividual = () => {
  const { metricId: selectedMetricId } = useParams<{ metricId: string }>();
  const queryClient = useQueryClient();

  const getMetricId = useMemoizedFn((metricId?: string): string => {
    return metricId || selectedMetricId;
  });

  //UI SELECTORS

  const getMetricMemoized = useMemoizedFn(({ metricId }: { metricId?: string }): IBusterMetric => {
    const _metricId = getMetricId(metricId);
    const options = queryKeys.metricsGetMetric(_metricId);
    const data = queryClient.getQueryData(options.queryKey);
    return resolveEmptyMetric(data, _metricId);
  });

  // STATE UPDATERS

  const metricUpdateConfig = useUpdateMetricConfig({
    getMetricId,
    getMetricMemoized
  });
  const { updateMetricMutation, onInitializeMetric } = metricUpdateConfig;

  const metricAssosciations = useUpdateMetricAssosciations({
    updateMetricMutation,
    getMetricMemoized
  });

  const metricShare = useShareMetric({ updateMetricMutation });

  const metricDelete = useMetricDelete();

  return {
    ...metricAssosciations,
    ...metricShare,
    ...metricUpdateConfig,
    ...metricDelete,
    onInitializeMetric,
    getMetricMemoized
  };
};

const BusterMetricsIndividual = createContext<ReturnType<typeof useBusterMetricsIndividual>>(
  {} as ReturnType<typeof useBusterMetricsIndividual>
);

export const BusterMetricsIndividualProvider: React.FC<PropsWithChildren> = React.memo(
  ({ children }) => {
    return (
      <BusterMetricsIndividual.Provider value={useBusterMetricsIndividual()}>
        {children}
      </BusterMetricsIndividual.Provider>
    );
  }
);
BusterMetricsIndividualProvider.displayName = 'BusterMetricsIndividualProvider';

export const useBusterMetricsIndividualContextSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterMetricsIndividual>) => T
) => {
  return useContextSelector(BusterMetricsIndividual, selector);
};
