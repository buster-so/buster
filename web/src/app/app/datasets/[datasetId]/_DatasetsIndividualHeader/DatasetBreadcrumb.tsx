import { createBusterRoute, BusterRoutes } from '@/routes';
import { BreadcrumbSeperator } from '@/components';
import { Breadcrumb } from 'antd';
import Link from 'next/link';
import React, { useMemo } from 'react';

export const DatasetBreadcrumb: React.FC<{
  datasetName?: string;
}> = React.memo(({ datasetName }) => {
  const breadcrumbItems = useMemo(() => {
    if (datasetName) {
      return [{ title: datasetName }];
    }

    return [
      {
        title: (
          <Link prefetch href={createBusterRoute({ route: BusterRoutes.APP_DATASETS })}>
            Datasets
          </Link>
        )
      }
    ];
  }, [datasetName]);

  return (
    <>
      <Breadcrumb
        className="flex items-center"
        items={breadcrumbItems}
        separator={<BreadcrumbSeperator />}
      />
    </>
  );
});

DatasetBreadcrumb.displayName = 'DatasetBreadcrumb';
