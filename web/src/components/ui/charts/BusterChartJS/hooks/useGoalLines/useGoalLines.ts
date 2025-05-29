/**
 * Hook for generating goal line annotations in Chart.js charts.
 * This hook processes goal lines configuration and returns annotation options
 * compatible with the chartjs-plugin-annotation plugin.
 *
 * Goal lines are horizontal or vertical lines that represent target values
 * or thresholds in charts. They can be customized with labels, colors,
 * and display options.
 *
 * @packageDocumentation
 */

import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import type {
  BusterChartConfigProps,
  ChartType,
  ColumnLabelFormat,
  GoalLine
} from '@/api/asset_interfaces/metric/charts';
import { formatLabel } from '@/lib/columnFormatter';
import type { AnnotationOptions, AnnotationPluginOptions } from 'chartjs-plugin-annotation';
import { useMemo } from 'react';
import { yAxisSimilar } from '../../../commonHelpers';
import { defaultLabelOptionConfig } from '../useChartSpecificOptions/labelOptionConfig';

/** Interface for the useGoalLines hook parameters */
interface UseGoalLinesParams {
  /** Array of goal line configurations */
  goalLines: GoalLine[];
  /** The type of chart being rendered */
  selectedChartType: ChartType;
  /** Format configurations for column labels */
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  /** Array of keys for the y-axis */
  yAxisKeys: string[];
  /** Optional array of keys for the secondary y-axis */
  y2AxisKeys: string[] | undefined;
  /** Type of line grouping */
  lineGroupType: BusterChartConfigProps['lineGroupType'];
  /** Layout configuration for bar charts */
  barLayout: BusterChartConfigProps['barLayout'];
  /** Type of bar grouping */
  barGroupType: BusterChartConfigProps['barGroupType'];
}

/**
 * Hook that generates Chart.js annotation options for goal lines
 *
 * @param params - Configuration parameters for goal lines
 * @returns Annotation options for Chart.js plugin
 */
export const useGoalLines = ({
  goalLines,
  selectedChartType,
  columnLabelFormats,
  yAxisKeys,
  y2AxisKeys,
  lineGroupType,
  barGroupType,
  barLayout
}: UseGoalLinesParams): AnnotationPluginOptions['annotations'] => {
  /**
   * Determines if the current chart configuration can support goal lines.
   * Goal lines are not supported for percentage stacked charts or when no y-axis keys are present.
   */
  const canSupportGoalLines = useMemo(() => {
    if (yAxisKeys.length === 0) {
      return false;
    }
    if (selectedChartType === 'bar') {
      return barGroupType !== 'percentage-stack';
    }
    if (selectedChartType === 'line') {
      return lineGroupType !== 'percentage-stack';
    }
    return false;
  }, [selectedChartType, barGroupType, lineGroupType]);

  /**
   * Determines the label format for goal lines based on the axis configurations.
   * If all axes use similar formats, uses the format of the first y-axis key.
   * Otherwise defaults to a standard number format.
   */
  const goalLineLabelFormat: ColumnLabelFormat = useMemo(() => {
    const allKeys = [...yAxisKeys, ...(y2AxisKeys || [])];
    const isSimilar = yAxisSimilar(allKeys, columnLabelFormats);
    if (isSimilar) {
      const key = yAxisKeys[0]!;
      return columnLabelFormats[key] || DEFAULT_COLUMN_LABEL_FORMAT;
    }
    return {
      columnType: 'number',
      style: 'number'
    };
  }, [columnLabelFormats, yAxisKeys, y2AxisKeys]);

  /**
   * Determines which axis properties to use based on chart type and layout.
   * For horizontal bar charts, uses x-axis properties.
   * For all other charts, uses y-axis properties.
   */
  const { minKey, maxKey } = useMemo(() => {
    if (selectedChartType === 'bar' && barLayout === 'horizontal') {
      return { minKey: 'xMin', maxKey: 'xMax' } as const;
    }
    return { minKey: 'yMin', maxKey: 'yMax' } as const;
  }, [selectedChartType, barLayout]);

  /**
   * Generates the annotation configurations for each goal line.
   * Creates line annotations with custom styling, labels, and positioning.
   */
  const annotations: AnnotationPluginOptions['annotations'] = useMemo(() => {
    if (!canSupportGoalLines) {
      return [];
    }

    return goalLines.reduce<Record<string, AnnotationOptions<'line'>>>((acc, goalLine, index) => {
      const { value, goalLineLabel, goalLineColor, showGoalLineLabel, show } = goalLine;
      if (show) {
        const id = `🔥-goal-line-${index}`;
        const formattedValue = [goalLineLabel, formatLabel(value, goalLineLabelFormat)]
          .filter(Boolean)
          .join(' ');

        const item: AnnotationOptions<'line'> = {
          type: 'line',
          id,
          [minKey]: value,
          [maxKey]: value,
          borderColor: goalLineColor || 'black',
          borderWidth: 1.5,
          borderDash: [5, 5],
          label: {
            content: formattedValue,
            display: showGoalLineLabel,
            //@ts-ignore
            anchor: 'end',
            align: 'top',
            ...defaultLabelOptionConfig
          }
        };
        acc[id] = item;
      }
      return acc;
    }, {});
  }, [goalLines, minKey, maxKey, canSupportGoalLines, goalLineLabelFormat]);

  return annotations;
};
