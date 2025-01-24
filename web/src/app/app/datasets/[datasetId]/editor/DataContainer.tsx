import { BusterDatasetData } from '@/api/buster_rest/datasets';
import { createStyles } from 'antd-style';
import React from 'react';
import isEmpty from 'lodash/isEmpty';
import AppDataGrid from '@/components/table/AppDataGrid';
import { IndeterminateLinearLoader } from '@/components/loaders';

export const DataContainer: React.FC<{
  data: BusterDatasetData;
  fetchingData: boolean;
  className?: string;
}> = React.memo(({ data, fetchingData, className }) => {
  const { styles, cx } = useStyles();
  const hasData = !isEmpty(data);

  return (
    <div className={cx(styles.container, 'relative h-full w-full overflow-hidden', className)}>
      <IndeterminateLinearLoader
        className={cx(
          'absolute left-0 top-0 z-10 w-full',
          fetchingData && hasData ? 'block' : '!hidden'
        )}
      />

      {hasData ? (
        <AppDataGrid rows={data} />
      ) : (
        <div className="flex h-full items-center justify-center">
          {fetchingData ? 'Loading data...' : 'No data returned'}
        </div>
      )}
    </div>
  );
});

DataContainer.displayName = 'DataContainer';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    background: ${token.colorBgBase};
    border-radius: ${token.borderRadius}px;
    border: 0.5px solid ${token.colorBorder};
  `
}));
