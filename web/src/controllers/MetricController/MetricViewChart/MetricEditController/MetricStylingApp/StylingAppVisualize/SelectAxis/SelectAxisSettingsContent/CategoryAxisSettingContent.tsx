import React from 'react';
import { EditGrouping } from './EditGrouping';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { useMemoizedFn } from '@/hooks';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { EditAxisTitle } from './EditShowAxisTitle';
import { useUpdateMetricChart } from '@/context/Metrics';

export const CategoryAxisSettingContent: React.FC<{}> = React.memo(({}) => {
  const { onUpdateMetricChartConfig } = useUpdateMetricChart();
  const selectedChartType = useSelectAxisContextSelector((x) => x.selectedChartType);
  const lineGroupType = useSelectAxisContextSelector((x) => x.lineGroupType);
  const barGroupType = useSelectAxisContextSelector((x) => x.barGroupType);
  const categoryAxisTitle = useSelectAxisContextSelector((x) => x.categoryAxisTitle);
  const barShowTotalAtTop = useSelectAxisContextSelector((x) => x.barShowTotalAtTop);

  const onChangeCategoryAxisTitle = useMemoizedFn((value: string | null) => {
    onUpdateMetricChartConfig({ chartConfig: { categoryAxisTitle: value } });
  });

  const onUpdateChartConfig = useMemoizedFn((chartConfig: Partial<IBusterMetricChartConfig>) => {
    onUpdateMetricChartConfig({ chartConfig });
  });

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
