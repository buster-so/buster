'use client';

import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import {
  type ChartEncodes,
  DEFAULT_CHART_CONFIG,
  DEFAULT_CHART_THEME,
  DEFAULT_COLUMN_METADATA
} from '@buster/server-shared/metrics';
import type { Chart } from 'chart.js';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import type { BusterChartProps } from './BusterChart.types';
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
import { doesChartHaveValidAxis } from './commonHelpers';
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
    colors = DEFAULT_CHART_THEME,
    columnMetadata = DEFAULT_COLUMN_METADATA,
    ...props
  }) => {
    const isTable = selectedChartType === 'table';
    const showNoData = !loading && (isEmpty(data) || data === null);

    const { pieChartAxis, comboChartAxis, scatterAxis, barAndLineAxis } = props;

    const selectedAxis: ChartEncodes | undefined = useMemo(() => {
      if (selectedChartType === 'pie') return pieChartAxis;
      if (selectedChartType === 'combo') return comboChartAxis;
      if (selectedChartType === 'scatter') return scatterAxis;
      if (selectedChartType === 'bar') return barAndLineAxis;
      if (selectedChartType === 'line') return barAndLineAxis;
      return undefined;
    }, [selectedChartType, pieChartAxis, comboChartAxis, scatterAxis, barAndLineAxis]);

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
      // if (!isMounted && selectedChartType !== 'table') return null;

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
            type={'table'}
            onMounted={onChartMounted}
            onInitialAnimationEnd={onInitialAnimationEndPreflight}
          />
        );
      }

      if (selectedChartType === 'metric') {
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
        colors,
        columnMetadata,
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
