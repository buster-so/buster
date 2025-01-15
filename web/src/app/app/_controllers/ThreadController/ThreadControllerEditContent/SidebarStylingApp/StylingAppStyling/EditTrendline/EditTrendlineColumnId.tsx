import { ColumnMetaData, IBusterThreadMessageChartConfig } from '@/api/buster-rest';
import { formatLabel } from '@/utils';
import { Select } from 'antd';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../Common';
import { LoopTrendline } from './EditTrendline';

export const TrendlineColumnId = React.memo(
  ({
    trend,
    columnMetadata,
    onUpdateExisitingTrendline,
    columnLabelFormats,
    yAxisEncodes
  }: {
    trend: LoopTrendline;
    columnMetadata: ColumnMetaData[];
    columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
    onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
    yAxisEncodes: string[];
  }) => {
    const options = useMemo(() => {
      return columnMetadata
        .filter((column) => yAxisEncodes.includes(column.name))
        .map((column) => {
          const columnLabelFormat = columnLabelFormats[column.name];
          return {
            label: formatLabel(column.name, columnLabelFormat, true),
            value: column.name
          };
        });
    }, [columnMetadata, columnLabelFormats, yAxisEncodes]);

    const defaultSelected = useMemo(() => {
      return options.find((option) => option.value === trend.columnId);
    }, [options, trend.columnId]);

    return (
      <LabelAndInput label="Column">
        <Select
          className="w-full overflow-hidden"
          options={options}
          defaultValue={defaultSelected?.value}
          onChange={(value) => onUpdateExisitingTrendline({ ...trend, columnId: value })}
        />
      </LabelAndInput>
    );
  }
);
TrendlineColumnId.displayName = 'TrendlineColumnId';
