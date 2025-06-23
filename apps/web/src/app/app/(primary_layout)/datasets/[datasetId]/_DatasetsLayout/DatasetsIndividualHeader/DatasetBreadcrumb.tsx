import React, { useMemo } from 'react';
import { Breadcrumb, type BreadcrumbItemType } from '@/components/ui/breadcrumb';
import { BusterRoutes } from '@/routes';

export const DatasetBreadcrumb: React.FC<{
  datasetName?: string;
}> = React.memo(({ datasetName }) => {
  const breadcrumbItems: BreadcrumbItemType[] = useMemo(() => {
    return [
      {
        label: 'Datasets',
        route: { route: BusterRoutes.APP_DATASETS }
      },
      { label: datasetName ?? '' }
    ].filter((item) => item.label) as BreadcrumbItemType[];
  }, [datasetName]);

  return <Breadcrumb items={breadcrumbItems} />;
});

DatasetBreadcrumb.displayName = 'DatasetBreadcrumb';
