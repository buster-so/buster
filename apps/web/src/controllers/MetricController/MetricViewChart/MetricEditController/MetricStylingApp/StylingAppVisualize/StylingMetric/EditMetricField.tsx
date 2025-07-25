import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { DEFAULT_COLUMN_SETTINGS } from '@buster/server-shared/metrics';
import type { DerivedMetricTitle } from '@buster/server-shared/metrics';
import { Button } from '@/components/ui/buttons';
import { Dots } from '@/components/ui/icons';
import { Popover } from '@/components/ui/popover/Popover';
import { Select } from '@/components/ui/select';
import { useMemoizedFn } from '@/hooks';
import { isNumericColumnStyle, isNumericColumnType } from '@/lib/messages';
import { LabelAndInput } from '../../Common';
import { SelectAxisContainerId } from '../SelectAxis/config';
import { SelectAxisDropdownContent } from '../SelectAxis/SelectAxisColumnContent';
import type { createColumnFieldOptions } from './helpers';

export const EditMetricField: React.FC<{
  label?: string;
  columnId: ChartConfigProps['metricColumnId'];
  columnLabelFormats: ChartConfigProps['columnLabelFormats'];
  columnFieldOptions: ReturnType<typeof createColumnFieldOptions>;
  rowCount: number;
  onUpdateMetricField: (config: {
    metricColumnId: string;
    metricValueAggregate?: DerivedMetricTitle['aggregate'];
  }) => void;
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = React.memo(
  ({
    columnId,
    columnFieldOptions,
    rowCount,
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
            items={columnFieldOptions}
            className="w-full overflow-hidden"
            value={selectedOption}
            onChange={onChangeOption}
          />
          <StylingPopover
            metricColumnId={columnId}
            rowCount={rowCount}
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
  metricColumnId: ChartConfigProps['metricColumnId'];
  columnLabelFormat: ChartConfigProps['columnLabelFormats'][string];
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
  rowCount: number;
}> = React.memo(({ metricColumnId, columnLabelFormat, rowCount }) => {
  return (
    <Popover
      content={
        <div className="w-full max-w-[315px] min-w-[315px]">
          <SelectAxisDropdownContent
            hideTitle
            columnLabelFormat={columnLabelFormat}
            id={metricColumnId}
            selectedChartType={'metric'}
            //Not applicable to metric chart but required by the component... need to think if this is best approach
            columnSetting={DEFAULT_COLUMN_SETTINGS}
            zoneId={SelectAxisContainerId.YAxis}
            lineGroupType={null}
            barGroupType={null}
            selectedAxis={null}
            rowCount={rowCount}
          />
        </div>
      }
      align="end"
      side="left"
      size="none">
      <Button variant="ghost" prefix={<Dots />} size={'tall'} />
    </Popover>
  );
});
StylingPopover.displayName = 'StylingPopover';
