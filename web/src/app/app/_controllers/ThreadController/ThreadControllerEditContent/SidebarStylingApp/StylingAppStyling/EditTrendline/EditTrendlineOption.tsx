import { Select } from 'antd';
import { LabelAndInput } from '../../Common';
import { trendlineOptions } from './config';
import { LoopTrendline } from './EditTrendline';
import React, { useMemo } from 'react';
import type { ChartType, Trendline } from '@/components/charts';
import { IBusterThreadMessageChartConfig } from '@/api/busterv2';
import { isDateColumnType, isNumericColumnType } from '@/utils';
import { AppMaterialIcons, AppTooltip } from '@/components';

export const EditTrendlineOption = React.memo(
  ({
    trend,
    onUpdateExisitingTrendline,
    columnLabelFormats,
    xAxisEncodes,
    yAxisEncodes,
    selectedChartType
  }: {
    trend: LoopTrendline;
    onUpdateExisitingTrendline: (trend: LoopTrendline) => void;
    yAxisEncodes: string[];
    xAxisEncodes: string[];
    columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
    selectedChartType: ChartType;
  }) => {
    const { type } = trend;

    const allXAxisAreNumeric = useMemo(() => {
      return (
        xAxisEncodes.length > 0 &&
        xAxisEncodes.every((encode) => {
          const columnLabelFormat = columnLabelFormats[encode];
          return isNumericColumnType(columnLabelFormat.columnType);
        })
      );
    }, [xAxisEncodes, columnLabelFormats]);

    const allYAxisAreNumeric = useMemo(() => {
      return (
        yAxisEncodes.length > 0 &&
        yAxisEncodes.every((encode) => {
          const columnLabelFormat = columnLabelFormats[encode];
          return isNumericColumnType(columnLabelFormat.columnType);
        })
      );
    }, [yAxisEncodes, columnLabelFormats]);

    const xIsSingleDate = useMemo(() => {
      return (
        xAxisEncodes.length === 1 &&
        isDateColumnType(columnLabelFormats[xAxisEncodes[0]].columnType)
      );
    }, [xAxisEncodes, columnLabelFormats]);

    const allowedOptions = useMemo(() => {
      return trendlineOptions
        .map((option) => {
          const disabled = disableTrendlineRecord[option.value](
            allXAxisAreNumeric,
            allYAxisAreNumeric,
            xIsSingleDate,
            selectedChartType
          );
          return {
            ...option,
            disabled: !!disabled,
            label: disabled ? (
              <div className="flex items-center space-x-1">
                <AppTooltip title={typeof disabled === 'string' ? disabled : ''}>
                  <div className="flex">
                    <AppMaterialIcons icon="warning" />
                  </div>
                </AppTooltip>
                <span>{option.label}</span>
              </div>
            ) : (
              option.label
            )
          };
        })
        .filter((option) => !option.disabled);
    }, [allXAxisAreNumeric, xIsSingleDate, allYAxisAreNumeric]);

    const selectedType = useMemo(() => {
      return allowedOptions.find((option) => option.value === type)?.value;
    }, [allowedOptions, type]);

    const onChangeSelect = (value: Trendline['type']) => {
      onUpdateExisitingTrendline({
        ...trend,
        type: value as unknown as LoopTrendline['type']
      });
    };

    return (
      <LabelAndInput label="Type">
        <div className="flex w-full justify-end overflow-hidden">
          <Select
            className="!w-full"
            options={allowedOptions}
            defaultValue={selectedType}
            onChange={onChangeSelect}
          />
        </div>
      </LabelAndInput>
    );
  }
);
EditTrendlineOption.displayName = 'EditTrendlineOption';

const regressionCheck = (
  allXAxisAreNumeric: boolean,
  allYAxisAreNumeric: boolean,
  xIsSingleDate: boolean,
  selectedChartType: ChartType
) => {
  if (selectedChartType === 'scatter') {
    return !(allXAxisAreNumeric || xIsSingleDate) || !allYAxisAreNumeric;
  }

  return true;
};

const disableTrendlineRecord: Record<
  Trendline['type'],
  (
    allXAxisAreNumeric: boolean,
    allYAxisAreNumeric: boolean,
    xIsSingleDate: boolean,
    selectedChartType: ChartType
  ) => boolean | string
> = {
  logarithmic_regression: regressionCheck,
  exponential_regression: regressionCheck,
  polynomial_regression: regressionCheck,
  min: (_, allYAxisAreNumeric) => !allYAxisAreNumeric,
  max: (_, allYAxisAreNumeric) => !allYAxisAreNumeric,
  median: (_, allYAxisAreNumeric) => !allYAxisAreNumeric,
  average: (_, allYAxisAreNumeric) => !allYAxisAreNumeric,
  linear_regression: (_, allYAxisAreNumeric, xIsSingleDate, selectedChartType) =>
    !allYAxisAreNumeric &&
    (selectedChartType === 'line' ||
      selectedChartType === 'scatter' ||
      (selectedChartType === 'bar' && xIsSingleDate))
};
