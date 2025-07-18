import { useMemo } from 'react';
import type { BusterChartProps } from '@/api/asset_interfaces/metric/charts';

const UNSUPPORTED_CHART_TYPES = ['metric', 'table'];

export const useLegendAutoShow = ({
  selectedChartType,
  showLegendProp = null,
  categoryAxisColumnNames,
  allYAxisColumnNames
}: {
  selectedChartType: BusterChartProps['selectedChartType'];
  showLegendProp: BusterChartProps['showLegend'];
  categoryAxisColumnNames: string[] | null | undefined;
  allYAxisColumnNames: string[];
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

    const defaultShowLegend = !!categoryAxisColumnNames?.length;

    return defaultShowLegend;
  }, [selectedChartType, allYAxisColumnNames, categoryAxisColumnNames, showLegendProp]);

  return showLegend;
};
