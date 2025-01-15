import { ChartType, ColumnLabelFormat, IColumnLabelFormat } from '@/components/charts/interfaces';
import { formatLabel } from '@/utils';
import type { SeriesOption, MarkLineComponentOption } from 'echarts';
import { useMemo } from 'react';
import { extractFieldsFromChain } from '../../../chartHooks';
import type { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import { ColumnMetaData } from '@/api/buster-rest';
import { yAxisSimilar } from '@/components/charts/commonHelpers';

export const GOAL_LINE_DELIMETER = '_🫷🥸🫸goal_';

const getSearchId = (index: number) => {
  return `${index}${GOAL_LINE_DELIMETER}`;
};

export const useGoalLines = (props: {
  yAxisKeys: string[];
  columnLabelFormats: Record<string, IColumnLabelFormat>;
  goalLines: IBusterThreadMessageChartConfig['goalLines'] | undefined;
  selectedChartType: ChartType;
}) => {
  const { yAxisKeys, columnLabelFormats, goalLines, selectedChartType } = props;

  const canSupportGoalLines = useMemo(() => {
    return (
      selectedChartType === ChartType.Line ||
      selectedChartType === ChartType.Bar ||
      selectedChartType === ChartType.Combo
    );
  }, [selectedChartType]);

  const goalAndLineTrendlineLabelFormat: ColumnLabelFormat = useMemo(() => {
    const columnFormats = yAxisKeys
      .map<{ format: IColumnLabelFormat; key: string }>((y) => {
        const { key } = extractFieldsFromChain(y)[0];
        return {
          format: columnLabelFormats[key],
          key
        };
      })
      .filter(({ key, format }) => !!key && !!format);

    if (columnFormats.length > 1) {
      const isSimilar = yAxisSimilar(
        columnFormats.map(({ key }) => key),
        columnLabelFormats
      );
      if (isSimilar) {
        return columnFormats[0]?.format;
      }

      return {
        columnType: 'number',
        style: 'number'
      };
    }

    return columnFormats[0]?.format;
  }, [yAxisKeys, columnLabelFormats]);

  const goalLineSeries: SeriesOption[] = useMemo(() => {
    if (!goalLines || !canSupportGoalLines) return [];
    const shownGoalLines = goalLines?.filter((goalLine) => goalLine.show);
    const markLines: MarkLineComponentOption[] = shownGoalLines.map((goalLine, index) => {
      const { goalLineLabel, value, showGoalLineLabel } = goalLine;
      return {
        name: getSearchId(index),
        silent: true,
        label: {
          inherit: true,
          show: showGoalLineLabel,
          formatter: ({ value }) => {
            const formattedValue = formatLabel(value as string, goalAndLineTrendlineLabelFormat);
            return [goalLineLabel as string, formattedValue].filter(Boolean).join(' ');
          }
        },
        data: [{ yAxis: value }],
        lineStyle: {
          color: goalLine.goalLineColor || undefined
        }
      };
    });

    return markLines.map<SeriesOption>((markLine) => ({
      name: markLine.name,
      type: 'line',
      markLine,
      emphasis: {
        focus: 'none'
      },

      data: []
    }));
  }, [goalLines, canSupportGoalLines, goalAndLineTrendlineLabelFormat]);

  return goalLineSeries;
};
