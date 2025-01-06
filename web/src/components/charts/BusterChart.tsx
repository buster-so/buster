'use client';

import React, { useMemo } from 'react';
import { BusterChartProps, ChartEncodes, ChartType, ViewType } from './interfaces';
import isEmpty from 'lodash/isEmpty';
import { doesChartHaveValidAxis } from './helpers';
import { useMemoizedFn } from 'ahooks';
import {
  NoChartData,
  PreparingYourRequestLoader
} from './LoadingComponents/ChartLoadingComponents';
import BusterTableChart from './TableChart';
import { DEFAULT_CHART_CONFIG } from '@/api/busterv2/threads/defaults';
import { DEFAULT_DATA } from './BusterChartLegend/config';
import { NoValidAxis } from './LoadingComponents';
import BusterMetricChart from './MetricChart';
import { BusterChartErrorWrapper } from './BusterChartErrorWrapper';
import { BusterChartWrapper } from './BusterChartWrapper';
import { BusterChartRenderComponentProps } from './interfaces/chartComponentInterfaces';
import { BusterChartComponent } from './BusterChartComponent';

export const BusterChart: React.FC<BusterChartProps> = React.memo(
  ({
    data = DEFAULT_DATA,
    groupByMethod = 'sum',
    loading = false,
    className = '',
    bordered = true,
    animate = true,
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
    useRapidResizeObserver = true,
    onInitialAnimationEnd,
    editable,
    selectedChartType,
    selectedView,
    columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
    renderType = 'chartjs',
    ...props
  }) => {
    const isTable = selectedView === ViewType.Table || selectedChartType === ChartType.Table;
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
    }, [selectedChartType, selectedView, isTable, selectedAxis]);

    const onChartMounted = useMemoizedFn((chart?: any) => {
      onChartMountedProp?.(chart);
    });

    const onInitialAnimationEndPreflight = useMemoizedFn(() => {
      onInitialAnimationEnd?.();
    });

    const SwitchComponent = useMemoizedFn(() => {
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
            editable={editable}
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
        renderType,
        data,
        onChartMounted,
        onInitialAnimationEnd: onInitialAnimationEndPreflight,
        selectedAxis: selectedAxis!,
        animate,
        className,
        useRapidResizeObserver,
        columnLabelFormats,
        selectedChartType,
        loading,
        ...props
      };

      return <BusterChartComponent {...chartProps} />;
    });

    return (
      <BusterChartErrorWrapper>
        <BusterChartWrapper
          id={id}
          className={className}
          bordered={bordered}
          loading={loading}
          useTableSizing={isTable && !loading && !showNoData && hasValidAxis}>
          {SwitchComponent()}
        </BusterChartWrapper>
      </BusterChartErrorWrapper>
    );
  }
);
BusterChart.displayName = 'BusterChart';
