'use client';

import {
  type BusterChartProps,
  type ChartEncodes,
  ChartType
} from '@/api/asset_interfaces/metric/charts';
import { DEFAULT_CHART_CONFIG } from '@/api/asset_interfaces/metric/defaults';
import { useMemoizedFn } from '@/hooks';
import type { Chart } from 'chart.js';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import { BusterChartComponent } from './BusterChartComponent';
import { BusterChartErrorWrapper } from './BusterChartErrorWrapper';
import { DEFAULT_DATA } from './BusterChartLegend/config';
import { BusterChartWrapper } from './BusterChartWrapper';
import { NoValidAxis } from './LoadingComponents';
import {
  NoChartData,
  PreparingYourRequestLoader
} from './LoadingComponents/ChartLoadingComponents';
import { BusterMetricChart } from './MetricChart';
import { BusterTableChart } from './TableChart';
import { doesChartHaveValidAxis } from './helpers';
import type { BusterChartRenderComponentProps } from './interfaces/chartComponentInterfaces';

export const BusterChart: React.FC<BusterChartProps> = React.memo(
  ({
    data = DEFAULT_DATA,
    groupByMethod = 'sum',
    loading = false,
    className = '',
    animate = true,
    animateLegend = true,
    readOnly = true,
    id,
    error,
    tableColumnOrder,
    tableColumnWidths,
    tableHeaderBackgroundColor,
    tableHeaderFontColor,
    tableColumnFontColor,
    metricColumnId,
    metricHeader,
    metricSubHeader,
    metricValueAggregate,
    metricValueLabel,
    onChartMounted: onChartMountedProp,
    onInitialAnimationEnd,
    selectedChartType,
    columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
    columnSettings = DEFAULT_CHART_CONFIG.columnSettings,
    ...props
  }) => {
    const isTable = selectedChartType === ChartType.Table;
    const showNoData = !loading && (isEmpty(data) || data === null);
    const selectedAxis: ChartEncodes | undefined = useMemo(() => {
      const { pieChartAxis, comboChartAxis, scatterAxis, barAndLineAxis } = props;
      if (selectedChartType === ChartType.Pie) return pieChartAxis;
      if (selectedChartType === ChartType.Combo) return comboChartAxis;
      if (selectedChartType === ChartType.Scatter) return scatterAxis;
      if (selectedChartType === ChartType.Bar) return barAndLineAxis;
      if (selectedChartType === ChartType.Line) return barAndLineAxis;
    }, [
      selectedChartType,
      props.pieChartAxis,
      props.comboChartAxis,
      props.scatterAxis,
      props.barAndLineAxis
    ]);

    const hasValidAxis = useMemo(() => {
      return doesChartHaveValidAxis({
        selectedChartType,
        selectedAxis,
        isTable
      });
    }, [selectedChartType, isTable, selectedAxis]);

    const onChartMounted = useMemoizedFn((chart?: Chart) => {
      onChartMountedProp?.(chart);
    });

    const onInitialAnimationEndPreflight = useMemoizedFn(() => {
      onInitialAnimationEnd?.();
    });

    const SwitchComponent = useMemoizedFn(() => {
      //chartjs need the parent to be mounted to render the chart. It is intermitent when it throws when the parent is not mounted.
      // if (!isMounted && selectedChartType !== ChartType.Table) return null;

      if (loading || error) {
        return <PreparingYourRequestLoader error={error} />;
      }

      if (showNoData || !data) {
        return <NoChartData />;
      }

      if (!hasValidAxis) {
        return <NoValidAxis type={selectedChartType} data={data} />;
      }

      if (isTable) {
        return (
          <BusterTableChart
            tableColumnOrder={tableColumnOrder}
            tableColumnWidths={tableColumnWidths}
            tableHeaderBackgroundColor={tableHeaderBackgroundColor}
            tableHeaderFontColor={tableHeaderFontColor}
            tableColumnFontColor={tableColumnFontColor}
            columnLabelFormats={columnLabelFormats}
            readOnly={readOnly}
            data={data}
            type={ChartType.Table}
            onMounted={onChartMounted}
            onInitialAnimationEnd={onInitialAnimationEndPreflight}
          />
        );
      }

      if (selectedChartType === ChartType.Metric) {
        return (
          <BusterMetricChart
            data={data}
            columnLabelFormats={columnLabelFormats}
            onMounted={onChartMounted}
            metricColumnId={metricColumnId}
            metricHeader={metricHeader}
            animate={animate}
            metricSubHeader={metricSubHeader}
            metricValueAggregate={metricValueAggregate}
            metricValueLabel={metricValueLabel}
            onInitialAnimationEnd={onInitialAnimationEndPreflight}
          />
        );
      }

      const chartProps: BusterChartRenderComponentProps = {
        ...DEFAULT_CHART_CONFIG,
        columnMetadata: props.columnMetadata ?? [],
        data,
        onChartMounted,
        onInitialAnimationEnd: onInitialAnimationEndPreflight,
        selectedAxis: selectedAxis as ChartEncodes,
        animate,
        animateLegend,
        className,
        columnLabelFormats,
        selectedChartType,
        loading,
        columnSettings,
        readOnly,
        ...props
      };

      return <BusterChartComponent {...chartProps} />;
    });

    return (
      <BusterChartErrorWrapper>
        <BusterChartWrapper id={id} className={className} loading={loading}>
          {SwitchComponent()}
        </BusterChartWrapper>
      </BusterChartErrorWrapper>
    );
  }
);
BusterChart.displayName = 'BusterChart';
