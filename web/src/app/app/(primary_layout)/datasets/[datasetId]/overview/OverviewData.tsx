import type { IDataResult } from '@/api/asset_interfaces';
import { AppDataGrid } from '@/components/ui/table/AppDataGrid';
import { Text } from '@/components/ui/typography';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from '@/hooks';
import isEmpty from 'lodash/isEmpty';
import React from 'react';

export const OverviewData: React.FC<{
  datasetId: string;
  data: IDataResult;
  isFetchedDatasetData: boolean;
}> = React.memo(({ data, isFetchedDatasetData }) => {
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);

  const defaultCellFormatter = useMemoizedFn((value: unknown): string => {
    return String(value);
  });

  return (
    <div className="scrollbar-thin h-full max-h-[70vh] w-full overflow-auto rounded border">
      {!isFetchedDatasetData ? (
        <LoadingState />
      ) : !isEmpty(data) ? (
        <AppDataGrid
          rows={data || []}
          headerFormat={isAdmin ? stableHeaderFormat : undefined}
          cellFormat={defaultCellFormatter}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  );
});

OverviewData.displayName = 'OverviewData';

const EmptyState = () => {
  return (
    <div className="bg-background flex justify-center py-24">
      <Text variant="tertiary">No data available</Text>
    </div>
  );
};

const LoadingState: React.FC = () => {
  return (
    <div className="flex justify-center py-24">
      <ShimmerText text="Loading data..." />
    </div>
  );
};

const stableHeaderFormat = (value: string | number | Date | null, key: string): string => {
  return String(value);
};
