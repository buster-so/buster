import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import type { ChartType, Trendline } from '@/api/asset_interfaces/metric/charts';
import { TriangleWarning } from '@/components/ui/icons';
import { Select, type SelectItem } from '@/components/ui/select';
import { AppTooltip } from '@/components/ui/tooltip';
import { isDateColumnType, isNumericColumnType } from '@/lib';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../Common';
import type { LoopTrendline } from './EditTrendline';
import { trendlineOptions } from './config';

export const EditTrendlineOption = React.memo(
  ({
    trend,
    onUpdateExistingTrendline,
    columnLabelFormats,
    xAxisEncodes,
    yAxisEncodes,
    selectedChartType
  }: {
    trend: LoopTrendline;
    onUpdateExistingTrendline: (trend: LoopTrendline) => void;
    yAxisEncodes: string[];
    xAxisEncodes: string[];
    columnLabelFormats: IBusterMetricChartConfig['columnLabelFormats'];
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

    const allowedOptions: SelectItem<NonNullable<Trendline['type']>>[] = useMemo(() => {
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
                    <TriangleWarning />
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
      onUpdateExistingTrendline({
        ...trend,
        type: value as unknown as LoopTrendline['type']
      });
    };

    return (
      <LabelAndInput label="Type">
        <div className="flex w-full justify-end overflow-hidden">
          <Select
            className="w-full!"
            items={allowedOptions}
            value={selectedType}
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
