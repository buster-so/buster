import React from 'react';
import { LabelAndInput } from '../../Common';
import type { ColumnMetaData, IBusterThreadMessageChartConfig } from '@/api/buster-rest';
import { useMemoizedFn } from 'ahooks';
import { DerivedTitleInput } from './EditDerivedHeader';

export const EditMetricSubHeader: React.FC<{
  metricSubHeader: IBusterThreadMessageChartConfig['metricSubHeader'];
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  metricColumnId: IBusterThreadMessageChartConfig['metricColumnId'];
  columnMetadata: ColumnMetaData[];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(
  ({
    metricSubHeader,
    columnMetadata,
    columnLabelFormats,
    metricColumnId,
    onUpdateChartConfig
  }) => {
    const columnLabelFormat = columnLabelFormats[metricColumnId];

    const onUpdateMetricHeader = useMemoizedFn(
      (newMetricSubHeader: IBusterThreadMessageChartConfig['metricSubHeader']) => {
        onUpdateChartConfig({ metricSubHeader: newMetricSubHeader });
      }
    );

    return (
      <LabelAndInput label={'Sub-header'}>
        <DerivedTitleInput
          type="subHeader"
          header={metricSubHeader}
          columnLabelFormat={columnLabelFormat}
          metricColumnId={metricColumnId}
          columnMetadata={columnMetadata}
          columnLabelFormats={columnLabelFormats}
          onUpdateHeaderConfig={onUpdateMetricHeader}
        />
      </LabelAndInput>
    );
  }
);
EditMetricSubHeader.displayName = 'EditMetricSubHeader';
