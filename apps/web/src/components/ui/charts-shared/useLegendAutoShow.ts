import { useMemo } from 'react';
import type { BusterChartProps } from '../charts/BusterChart.types';

const UNSUPPORTED_CHART_TYPES = ['metric', 'table'];

export const useLegendAutoShow = ({
  selectedChartType,
  showLegendProp = null,
  categoryAxisColumnNames,
  colorByColumnNames,
  allYAxisColumnNames,
}: {
  selectedChartType: BusterChartProps['selectedChartType'];
  showLegendProp: BusterChartProps['showLegend'];
  categoryAxisColumnNames: string[] | null | undefined;
  allYAxisColumnNames: string[];
  colorByColumnNames: string[];
}) => {
  const showLegend = useMemo(() => {
    if (UNSUPPORTED_CHART_TYPES.includes(selectedChartType)) {
      return false;
    }

    if (typeof showLegendProp === 'boolean') {
      return showLegendProp;
    }

    if (
      selectedChartType === 'scatter' &&
      (categoryAxisColumnNames?.length || allYAxisColumnNames?.length)
    ) {
      return true;
    }

    if (
      (allYAxisColumnNames.length && allYAxisColumnNames.length > 1) ||
      selectedChartType === 'pie' ||
      selectedChartType === 'combo'
    ) {
      return true;
    }

    const defaultShowLegend = !!categoryAxisColumnNames?.length || !!colorByColumnNames?.length;

    return defaultShowLegend;
  }, [
    selectedChartType,
    allYAxisColumnNames,
    categoryAxisColumnNames,
    showLegendProp,
    colorByColumnNames,
  ]);

  return showLegend;
};
