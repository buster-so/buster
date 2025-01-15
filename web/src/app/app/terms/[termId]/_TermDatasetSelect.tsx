import { BusterTerm } from '@/api/buster-rest';
import { AppTooltip, AppMaterialIcons } from '@/components';
import { AppDropdownSelectProps, AppDropdownSelect } from '@/components/dropdown';
import { useDatasetContextSelector } from '@/context/Datasets';
import { useMount } from 'ahooks';
import { createStyles } from 'antd-style';
import React, { useContext, useMemo } from 'react';
import { Button } from 'antd';
import { Text } from '@/components';
import { useGetDatasets } from '@/api/buster-rest/datasets';

const useStyles = createStyles(({ token, css }) => ({
  datasetItem: css`
    border: 0.5px solid ${token.colorBorder};
    background: ${token.controlItemBgActive};
    cursor: pointer;
    overflow: hidden;
    &:hover {
      background: ${token.controlItemBgHover};
    }
  `,
  addButton: css`
    background: ${token.colorBgBase};
    color: ${token.colorIcon};
    cursor: pointer;
    border: 0.5px solid ${token.colorBorder};
    height: ${token.controlHeight}px;
    width: ${token.controlHeight}px;
    &:hover {
      background: ${token.controlItemBgHover};
      color: ${token.colorIconHover};
    }
  `
}));

export const DatasetList: React.FC<{
  termId?: string;
  selectedDatasets: BusterTerm['datasets'];
  onChange: (datasets: string[]) => void;
}> = React.memo(({ onChange, termId, selectedDatasets }) => {
  const { styles, cx } = useStyles();

  return (
    <div className="flex flex-wrap gap-2">
      {selectedDatasets.map((item) => (
        <DropdownSelect key={item.id} onChange={onChange} datasets={selectedDatasets}>
          <div className={cx(styles.datasetItem, 'flex items-center rounded-full px-2 py-1')}>
            <Text>{item.name}</Text>
          </div>
        </DropdownSelect>
      ))}

      <DropdownSelect datasets={selectedDatasets} onChange={onChange}>
        <AppTooltip className="!flex items-center justify-center" title={'Add a dataset'}>
          {selectedDatasets.length === 0 ? (
            <DropdownEmptyButton />
          ) : (
            <div className={cx(styles.addButton, 'flex items-center justify-center rounded-full')}>
              <AppMaterialIcons size={18} icon="add" />
            </div>
          )}
        </AppTooltip>
      </DropdownSelect>
    </div>
  );
});
DatasetList.displayName = 'DatasetList';

const DropdownSelect: React.FC<{
  children: React.ReactNode;
  datasets: BusterTerm['datasets'];
  onChange: (datasets: string[]) => void;
  placement?: AppDropdownSelectProps['placement'];
}> = ({ onChange, children, datasets, placement = 'bottomRight' }) => {
  const { data: datasetsList } = useGetDatasets();

  const itemsDropdown = useMemo(() => {
    return datasetsList.map((item) => ({
      key: item.id,
      label: item.name,
      onClick: async () => {
        const isSelected = datasets.find((i) => i.id === item.id);
        const newDatasets = isSelected
          ? datasets.filter((i) => i.id !== item.id)
          : [...datasets, item];
        onChange(newDatasets.map((i) => i.id));
      }
    }));
  }, [datasets, datasetsList]);

  const selectedItems = useMemo(() => {
    return datasets.map((item) => item.id);
  }, [datasets]);

  return (
    <AppDropdownSelect
      placement={placement}
      items={itemsDropdown}
      destroyPopupOnHide
      headerContent={'Related datasets...'}
      selectedItems={selectedItems}
      trigger={['click']}>
      {children}
    </AppDropdownSelect>
  );
};

const DropdownEmptyButton: React.FC<{ onClick?: () => void }> = React.memo(({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      type="default"
      icon={<AppMaterialIcons size={18} icon="table_view" />}
      className="">
      Datasets
    </Button>
  );
});

DropdownEmptyButton.displayName = 'DropdownEmptyButton';
