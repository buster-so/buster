import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { useUpdateMetricChart } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { EditGrouping } from './EditGrouping';
import { EditAxisTitle } from './EditShowAxisTitle';

export const CategoryAxisSettingContent: React.FC = React.memo(() => {
  const { onUpdateMetricChartConfig: contextOnUpdateMetricChartConfig } = useUpdateMetricChart();
  const selectedChartType = useSelectAxisContextSelector((x) => x.selectedChartType);
  const lineGroupType = useSelectAxisContextSelector((x) => x.lineGroupType);
  const barGroupType = useSelectAxisContextSelector((x) => x.barGroupType);
  const categoryAxisTitle = useSelectAxisContextSelector((x) => x.categoryAxisTitle);
  const barShowTotalAtTop = useSelectAxisContextSelector((x) => x.barShowTotalAtTop);

  const onChangeCategoryAxisTitle = useMemoizedFn((value: string | null) => {
    contextOnUpdateMetricChartConfig({ chartConfig: { categoryAxisTitle: value } });
  });

  const onUpdateChartConfig = useMemoizedFn((chartConfig: Partial<IBusterMetricChartConfig>) => {
    contextOnUpdateMetricChartConfig({ chartConfig });
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
