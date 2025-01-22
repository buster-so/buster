import React from 'react';
import { EditGrouping } from './EditGrouping';
import { useBusterThreadsContextSelector } from '@/context/Threads/BusterThreadsProvider';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { useMemoizedFn } from 'ahooks';
import { IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import { EditAxisTitle } from './EditShowAxisTitle';

export const CategoryAxisSettingContent: React.FC<{}> = React.memo(({}) => {
  const onUpdateMessageChartConfig = useBusterThreadsContextSelector(
    ({ onUpdateMessageChartConfig }) => onUpdateMessageChartConfig
  );
  const selectedChartType = useSelectAxisContextSelector((x) => x.selectedChartType);
  const lineGroupType = useSelectAxisContextSelector((x) => x.lineGroupType);
  const barGroupType = useSelectAxisContextSelector((x) => x.barGroupType);
  const categoryAxisTitle = useSelectAxisContextSelector((x) => x.categoryAxisTitle);
  const barShowTotalAtTop = useSelectAxisContextSelector((x) => x.barShowTotalAtTop);

  const onChangeCategoryAxisTitle = useMemoizedFn((value: string | null) => {
    onUpdateMessageChartConfig({ chartConfig: { categoryAxisTitle: value } });
  });

  const onUpdateChartConfig = useMemoizedFn(
    (chartConfig: Partial<IBusterThreadMessageChartConfig>) => {
      onUpdateMessageChartConfig({ chartConfig });
    }
  );

  return (
    <>
      <EditAxisTitle
        label="Title"
        axisTitle={categoryAxisTitle}
        onChangeTitle={onChangeCategoryAxisTitle}
        formattedColumnTitle={'Column ID'}
      />

      <EditGrouping
        selectedChartType={selectedChartType}
        barGroupType={barGroupType}
        lineGroupType={lineGroupType}
        onUpdateChartConfig={onUpdateChartConfig}
        barShowTotalAtTop={barShowTotalAtTop}
      />
    </>
  );
});
CategoryAxisSettingContent.displayName = 'CategoryAxisSettingContent';
