import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';

export const useGetAssetVersionNumber = <TQueryData, TError = unknown>(
  query: UseQueryOptions<TQueryData, TError>,
  versionNumber: number | 'LATEST' | undefined,
  stableVersionDataSelector: (data: TQueryData) => number,
  stableVersionSearchSelector: (state: ReturnType<typeof useSearch>['select']) => number | undefined
) => {
  const { data: latestVersionNumber } = useQuery({
    ...query,
    enabled: false,
    select: stableVersionDataSelector,
  });

  const paramVersionNumber = useSearch({
    select: stableVersionSearchSelector,
    strict: false,
  });

  const isLatest =
    !versionNumber || versionNumber === 'LATEST' || latestVersionNumber === versionNumber;

  const selectedVersionNumber = isLatest
    ? ('LATEST' as const)
    : (versionNumber ?? paramVersionNumber ?? 'LATEST');

  return useMemo(
    () => ({ paramVersionNumber, selectedVersionNumber, latestVersionNumber }),
    [paramVersionNumber, selectedVersionNumber, latestVersionNumber]
  );
};
