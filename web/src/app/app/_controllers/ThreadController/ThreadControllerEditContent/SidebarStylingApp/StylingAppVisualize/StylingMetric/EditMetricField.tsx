import type { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import { isNumericColumnStyle, isNumericColumnType } from '@/utils';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../Common';
import { Button, Select } from 'antd';
import { DEFAULT_COLUMN_SETTINGS, type ColumnMetaData } from '@/api/buster-rest';
import { useMemoizedFn } from 'ahooks';
import { createColumnFieldOptions } from './helpers';
import { AppMaterialIcons, AppPopover } from '@/components';
import { SelectAxisDropdownContent } from '../SelectAxis/SelectAxisColumnContent';
import { ChartType, DerivedMetricTitle } from '@/components/charts';
import { SelectAxisContainerId } from '../SelectAxis/config';

export const EditMetricField: React.FC<{
  label?: string;
  columnId: IBusterThreadMessageChartConfig['metricColumnId'];
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  columnFieldOptions: ReturnType<typeof createColumnFieldOptions>;
  columnMetadata: ColumnMetaData[];
  onUpdateMetricField: (config: {
    metricColumnId: string;
    metricValueAggregate?: DerivedMetricTitle['aggregate'];
  }) => void;
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(
  ({
    columnId,
    columnFieldOptions,
    columnMetadata,
    label = 'Metric column',
    columnLabelFormats,
    onUpdateMetricField,
    onUpdateChartConfig
  }) => {
    const selectedOption = useMemo(() => {
      return columnFieldOptions.find((option) => option.value === columnId)?.value;
    }, [columnFieldOptions, columnId]);

    const onChangeOption = useMemoizedFn((value: string) => {
      const columnLabelFormat = columnLabelFormats[value];
      const isNumberColumnType =
        isNumericColumnType(columnLabelFormat.columnType) &&
        isNumericColumnStyle(columnLabelFormat.style);
      const newConfig: {
        metricColumnId: string;
        metricValueAggregate?: DerivedMetricTitle['aggregate'];
      } = {
        metricColumnId: value
      };

      if (!isNumberColumnType)
        newConfig.metricValueAggregate = 'first' as DerivedMetricTitle['aggregate'];
      onUpdateMetricField(newConfig);
    });

    const columnLabelFormat = useMemo(() => {
      return columnLabelFormats[columnId];
    }, [columnLabelFormats, columnId]);

    return (
      <LabelAndInput label={label}>
        <div className="flex items-center justify-between space-x-1.5 overflow-hidden">
          <Select
            options={columnFieldOptions}
            className="w-full overflow-hidden"
            popupMatchSelectWidth={false}
            value={selectedOption}
            onChange={onChangeOption}
          />
          <StylingPopover
            metricColumnId={columnId}
            columnLabelFormat={columnLabelFormat}
            onUpdateChartConfig={onUpdateChartConfig}
          />
        </div>
      </LabelAndInput>
    );
  }
);
EditMetricField.displayName = 'EditMetricField';

const StylingPopover: React.FC<{
  metricColumnId: IBusterThreadMessageChartConfig['metricColumnId'];
  columnLabelFormat: IBusterThreadMessageChartConfig['columnLabelFormats'][string];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = ({ metricColumnId, columnLabelFormat }) => {
  return (
    <AppPopover
      trigger="click"
      destroyTooltipOnHide
      content={
        <div className="w-full min-w-[315px] max-w-[315px]">
          <SelectAxisDropdownContent
            hideTitle
            columnLabelFormat={columnLabelFormat}
            id={metricColumnId}
            selectedChartType={ChartType.Metric}
            //Not applicable to metric chart but required by the component... need to think if this is best approach
            columnSetting={DEFAULT_COLUMN_SETTINGS}
            zoneId={SelectAxisContainerId.YAxis}
            lineGroupType={null}
            barGroupType={null}
            selectedAxis={null}
          />
        </div>
      }
      placement="leftBottom">
      <Button type="text" icon={<AppMaterialIcons icon="more_horiz" />} />
    </AppPopover>
  );
};
