import { useDeleteDataset } from '@/api/buster-rest';
import { AppMaterialIcons } from '@/components';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { Button, Dropdown, MenuProps } from 'antd';
import React, { useMemo } from 'react';

export const DatasetIndividualThreeDotMenu: React.FC<{
  datasetId?: string;
}> = React.memo(({ datasetId }) => {
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const { mutateAsync: onDeleteDataset } = useDeleteDataset();

  const menu: MenuProps = useMemo(() => {
    return {
      items: [
        {
          key: '1',
          label: 'Delete dataset',
          icon: <AppMaterialIcons icon="delete" />,
          onClick: datasetId
            ? async () => {
                await onDeleteDataset(datasetId);
                onChangePage({
                  route: BusterRoutes.APP_DATASETS
                });
              }
            : undefined
        }
      ]
    };
  }, [datasetId, onDeleteDataset]);

  return (
    <Dropdown menu={menu} trigger={['click']}>
      <Button type="text" icon={<AppMaterialIcons icon="more_horiz" />} />
    </Dropdown>
  );
});
DatasetIndividualThreeDotMenu.displayName = 'DatasetIndividualThreeDotMenu';
