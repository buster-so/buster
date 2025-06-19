import React, { useMemo } from 'react';
import type { BusterTerm } from '@/api/asset_interfaces/terms';
import { useGetDatasets } from '@/api/buster_rest/datasets';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownProps } from '@/components/ui/dropdown';
import { Plus, Table } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';

// const useStyles = createStyles(({ token, css }) => ({
//   addButton: css`
//     background: ${token.colorBgBase};
//     color: ${token.colorIcon};
//     cursor: pointer;
//     border: 0.5px solid ${token.colorBorder};
//     height: ${token.controlHeight}px;
//     width: ${token.controlHeight}px;
//     &:hover {
//       background: ${token.controlItemBgHover};
//       color: ${token.colorIconHover};
//     }
//   `
// }));

export const DatasetList: React.FC<{
  termId?: string;
  selectedDatasets: BusterTerm['datasets'];
  onChange: (datasets: string[]) => void;
}> = React.memo(({ onChange, termId, selectedDatasets }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {selectedDatasets.map((item) => (
        <DropdownSelect key={item.id} onChange={onChange} datasets={selectedDatasets}>
          <div
            className={cn(
              'border-default-border bg-item-active hover:bg-item-hover flex cursor-pointer items-center overflow-hidden rounded-full border px-2 py-1'
            )}>
            <Text>{item.name}</Text>
          </div>
        </DropdownSelect>
      ))}

      <DropdownSelect datasets={selectedDatasets} onChange={onChange}>
        <AppTooltip title={'Add a dataset'}>
          {selectedDatasets.length === 0 ? (
            <DropdownEmptyButton />
          ) : (
            <div
              className={cn(
                'bg-background text-icon-color border-border hover:bg-item-hover hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border'
              )}>
              <Plus />
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
}> = ({ onChange, children, datasets }) => {
  const { data: datasetsList } = useGetDatasets();

  const itemsDropdown: DropdownProps['items'] = useMemo(() => {
    return datasetsList.map<DropdownProps['items'][number]>((item) => ({
      label: item.name,
      value: item.id,
      selected: datasets.some((i) => i.id === item.id),
      onClick: async () => {
        const isSelected = datasets.find((i) => i.id === item.id);
        const newDatasets = isSelected
          ? datasets.filter((i) => i.id !== item.id)
          : [...datasets, item];
        onChange(newDatasets.map((i) => i.id));
      }
    }));
  }, [datasets, datasetsList, onChange]);

  const onSelect = useMemoizedFn((itemId: string) => {
    alert('This feature is not implemented yet');
  });

  return (
    <Dropdown
      align={'start'}
      side="bottom"
      selectType="multiple"
      items={itemsDropdown}
      onSelect={onSelect}
      menuHeader={'Related datasets...'}>
      {children}
    </Dropdown>
  );
};

const DropdownEmptyButton: React.FC<{ onClick?: () => void }> = React.memo(({ onClick }) => {
  return (
    <Button onClick={onClick} prefix={<Table />} className="">
      Datasets
    </Button>
  );
});

DropdownEmptyButton.displayName = 'DropdownEmptyButton';
