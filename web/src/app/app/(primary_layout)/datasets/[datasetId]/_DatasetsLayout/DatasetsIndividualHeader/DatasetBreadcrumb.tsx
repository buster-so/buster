import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';
import { BusterRoutes } from '@/routes';
import React, { useMemo } from 'react';

export const DatasetBreadcrumb: React.FC<{
  datasetName?: string;
}> = React.memo(({ datasetName }) => {
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    return [
      {
        label: 'Datasets',
        route: { route: BusterRoutes.APP_DATASETS }
      },
      { label: datasetName ?? '' }
    ].filter((item) => item.label) as BreadcrumbItem[];
  }, [datasetName]);

  return <Breadcrumb items={breadcrumbItems} />;
});

DatasetBreadcrumb.displayName = 'DatasetBreadcrumb';
