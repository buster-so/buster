import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { Query, useQueryClient } from '@tanstack/react-query';
import { IBusterMetric } from '@/api/asset_interfaces/metric';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import last from 'lodash/last';
import { useMemoizedFn } from '@/hooks';
import { RustApiError } from '../errors';
import { createContext, useContextSelector } from 'use-context-selector';

interface MetricVersionContextType {
  selectedVersionNumber: number | null;
  paramVersionNumber?: number;
  latestVersionNumber: number | null;
}

const MetricVersionContext = createContext<MetricVersionContextType>({
  selectedVersionNumber: null,
  latestVersionNumber: null
});

export const useMetricVersionSelector = <T,>(selector: (state: MetricVersionContextType) => T) =>
  useContextSelector(MetricVersionContext, selector);

const useMetricVersionContext = () => {
  const { metricId } = useParams() as {
    metricId: string | undefined;
  };
  const latestVersionNumber = useGetLatestMetricVersion({ metricId: metricId! });
  const versionNumberQueryParam = useSearchParams().get('metric_version_number');
  const versionNumberFromParams = metricId ? versionNumberQueryParam : undefined;

  const paramVersionNumber = useMemo(() => {
    return versionNumberFromParams ? parseInt(versionNumberFromParams) : undefined;
  }, [versionNumberFromParams]);

  const selectedVersionNumber: number | null = useMemo(() => {
    return paramVersionNumber || latestVersionNumber || 0;
  }, [paramVersionNumber, latestVersionNumber]);

  return useMemo(() => {
    return { selectedVersionNumber, paramVersionNumber, latestVersionNumber };
  }, [selectedVersionNumber, paramVersionNumber, latestVersionNumber]);
};

export const MetricVersionProvider = React.memo(({ children }: PropsWithChildren) => {
  const contextValue = useMetricVersionContext();
  return (
    <MetricVersionContext.Provider value={contextValue}>{children}</MetricVersionContext.Provider>
  );
});

MetricVersionProvider.displayName = 'MetricVersionProvider';

export const useGetMetricVersionNumber = (props?: { versionNumber?: number | null }) => {
  const { versionNumber: versionNumberProp } = props || {};
  const { selectedVersionNumber, paramVersionNumber, latestVersionNumber } =
    useMetricVersionSelector((state) => state);

  const effectiveVersionNumber = useMemo(() => {
    if (versionNumberProp === null) return null;
    return versionNumberProp ?? selectedVersionNumber;
  }, [versionNumberProp, selectedVersionNumber]);

  return useMemo(() => {
    return {
      selectedVersionNumber: effectiveVersionNumber,
      paramVersionNumber,
      latestVersionNumber
    };
  }, [effectiveVersionNumber, paramVersionNumber, latestVersionNumber]);
};

type PredicateType = (query: Query<IBusterMetric, RustApiError>) => boolean;
const filterMetricPredicate: PredicateType = (query) => {
  const lastKey = last(query.queryKey);
  return (
    typeof lastKey === 'number' &&
    !!lastKey &&
    query.state.data !== undefined &&
    typeof query.state.data === 'object' &&
    query.state.data !== null &&
    'versions' in query.state.data
  );
};

const getLatestVersionNumber = (queries: [readonly unknown[], IBusterMetric | undefined][]) => {
  let latestVersion = -Infinity;

  for (const [queryKey, data] of queries) {
    if (data && typeof data === 'object' && 'versions' in data) {
      const lastVersion = last(data.versions);
      const version = Number(lastVersion?.version_number);
      if (!isNaN(version)) {
        latestVersion = Math.max(latestVersion, version);
      }
    }
  }

  return latestVersion === -Infinity ? null : latestVersion;
};

const useGetLatestMetricVersion = ({ metricId }: { metricId: string }) => {
  const queryClient = useQueryClient();
  const [latestVersion, setLatestVersion] = useState<number | null>(null);

  const memoizedKey = useMemo(() => {
    return metricsQueryKeys.metricsGetMetric(metricId, null).queryKey.slice(0, -1);
  }, [metricId]);

  const updateLatestVersion = useMemoizedFn(() => {
    const queries = queryClient.getQueriesData<IBusterMetric, any>({
      queryKey: memoizedKey,
      predicate: filterMetricPredicate
    });
    const newVersion = getLatestVersionNumber(queries);
    setLatestVersion(newVersion);
  });

  useEffect(() => {
    // Initial computation
    updateLatestVersion();

    // Subscribe to cache updates
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.query.queryKey[2] === last(memoizedKey) &&
        event.query.queryKey[1] === memoizedKey[1]
      ) {
        updateLatestVersion();
      }
    });

    return () => unsubscribe();
  }, [memoizedKey, updateLatestVersion]);

  return latestVersion;
};

//This is a helper function that returns the latest version number for a metric
export const useGetLatestMetricVersionMemoized = () => {
  const queryClient = useQueryClient();

  const method = useMemoizedFn((metricId: string) => {
    const queries = queryClient.getQueriesData<IBusterMetric, any>({
      queryKey: metricsQueryKeys.metricsGetMetric(metricId, null).queryKey.slice(0, -1),
      predicate: filterMetricPredicate
    });

    return getLatestVersionNumber(queries);
  });

  return method;
};
