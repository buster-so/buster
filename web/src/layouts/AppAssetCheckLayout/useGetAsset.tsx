'use client';

import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import type { RustApiError } from '@/api/buster_rest/errors';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { useGetCollection } from '@/api/buster_rest/collections';

type AssetType = 'metric' | 'dashboard' | 'collection';

interface BaseGetAssetProps {
  assetId: string;
  type: AssetType;
  versionNumber?: number;
}

type UseGetAssetProps = BaseGetAssetProps;

interface AssetAccess {
  hasAccess: boolean;
  passwordRequired: boolean;
  isPublic: boolean;
  isDeleted: boolean;
}

interface AssetQueryResult {
  isFetched: boolean;
  error: RustApiError | null;
  isError?: boolean;
  showLoader?: boolean;
}

const getAssetAccess = (error: RustApiError | null): AssetAccess => {
  if (!error) {
    return { hasAccess: true, passwordRequired: false, isPublic: false, isDeleted: false };
  }

  if (error.status === 418) {
    return { hasAccess: false, passwordRequired: true, isPublic: true, isDeleted: false };
  }

  if (error.status === 410) {
    return { hasAccess: false, passwordRequired: false, isPublic: false, isDeleted: true };
  }

  return { hasAccess: false, passwordRequired: false, isPublic: false, isDeleted: false };
};

const useVersionNumber = (props: UseGetAssetProps) => {
  const searchParams = useSearchParams();
  const metricVersionNumber = searchParams.get('metric_version_number');
  const dashboardVersionNumber = searchParams.get('dashboard_version_number');

  return useMemo(() => {
    if (props.versionNumber) return props.versionNumber;

    const queryVersion =
      props.type === 'metric'
        ? metricVersionNumber
        : props.type === 'dashboard'
          ? dashboardVersionNumber
          : null;

    return queryVersion ? Number.parseInt(queryVersion) : undefined;
  }, [props.type, props.versionNumber, metricVersionNumber, dashboardVersionNumber]);
};

export const useGetAsset = (props: UseGetAssetProps) => {
  const versionNumber = useVersionNumber(props);
  const isMetric = props.type === 'metric';
  const isDashboard = props.type === 'dashboard';
  const isCollection = props.type === 'collection';

  // Always call hooks at the top level with appropriate enabled flags
  const { error: metricError, isFetched: metricIsFetched } = useGetMetric(
    {
      id: isMetric ? props.assetId : undefined,
      versionNumber
    },
    { enabled: isMetric && props.assetId !== undefined }
  );

  const { isFetched: metricDataIsFetched } = useGetMetricData({
    id: isMetric ? props.assetId : undefined,
    versionNumber
  });

  const {
    isFetched: dashboardIsFetched,
    error: dashboardError,
    isError: dashboardIsError
  } = useGetDashboard(
    {
      id: isDashboard ? props.assetId : undefined,
      versionNumber
    },
    { enabled: isDashboard }
  );

  const {
    isFetched: collectionIsFetched,
    error: collectionError,
    isError: collectionIsError
  } = useGetCollection(isCollection ? props.assetId : undefined);

  const currentQuery = useMemo((): AssetQueryResult => {
    switch (props.type) {
      case 'metric':
        return {
          isFetched: metricIsFetched,
          error: metricError,
          isError: !!metricError,
          showLoader: !metricDataIsFetched && !metricError && !metricIsFetched
        };
      case 'dashboard':
        return {
          isFetched: dashboardIsFetched,
          error: dashboardError,
          isError: dashboardIsError,
          showLoader: !dashboardIsFetched && !dashboardIsError
        };
      case 'collection':
        return {
          isFetched: collectionIsFetched,
          error: collectionError,
          isError: collectionIsError,
          showLoader: !collectionIsFetched && !collectionIsError
        };
      default: {
        const exhaustiveCheck: never = props.type;
        return { isFetched: false, error: null, isError: false, showLoader: false };
      }
    }
  }, [
    props.type,
    metricIsFetched,
    metricError,
    metricDataIsFetched,
    dashboardIsFetched,
    dashboardError,
    dashboardIsError,
    collectionIsFetched,
    collectionError,
    collectionIsError
  ]);

  const { hasAccess, passwordRequired, isPublic } = getAssetAccess(currentQuery.error);

  return {
    isFetched: currentQuery.isFetched,
    error: currentQuery.error,
    hasAccess,
    passwordRequired,
    isPublic,
    showLoader: currentQuery.showLoader
  };
};
