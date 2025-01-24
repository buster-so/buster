import { BusterDatasetData } from '@/api/buster_rest/datasets';
import { ShimmerText } from '@/components';
import AppDataGrid from '@/components/table/AppDataGrid';
import { useUserConfigContextSelector } from '@/context/Users';
import { useAntToken } from '@/styles/useAntToken';
import React from 'react';
import { Text } from '@/components/text';
import { useMemoizedFn } from 'ahooks';
import isEmpty from 'lodash/isEmpty';
import { createStyles } from 'antd-style';

export const OverviewData: React.FC<{
  datasetId: string;
  data: BusterDatasetData;
  isFetchedDatasetData: boolean;
}> = React.memo(({ data, isFetchedDatasetData }) => {
  const token = useAntToken();
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);

  const defaultCellFormatter = useMemoizedFn((value: any, key: string): string => {
    return String(value);
  });

  return (
    <div
      className="buster-chart h-full w-full overflow-auto"
      style={{
        maxHeight: '70vh',
        border: `0.5px solid ${token.colorBorder}`,
        borderRadius: `${token.borderRadius}px`
      }}>
      {!isFetchedDatasetData ? (
        <LoadingState />
      ) : !isEmpty(data) ? (
        <AppDataGrid
          rows={data || []}
          headerFormat={isAdmin ? (v) => v : undefined}
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
  const { styles, cx } = useStyles();
  return (
    <div className={cx(styles.emptyState, 'flex justify-center py-24')}>
      <Text type="tertiary">No data available</Text>
    </div>
  );
};

const LoadingState: React.FC<{}> = () => {
  return (
    <div className="flex justify-center py-24">
      <ShimmerText text="Loading data..." />
    </div>
  );
};

const useStyles = createStyles(({ token }) => ({
  emptyState: {
    background: token.colorBgBase
  }
}));
