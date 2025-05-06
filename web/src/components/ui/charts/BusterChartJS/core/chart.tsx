'use client';

import React, { useEffect, useRef, forwardRef } from 'react';
import { Chart as ChartJS } from 'chart.js';
import type { ChartType, DefaultDataPoint } from 'chart.js';
import type { ForwardedRef, ChartProps, BaseChartComponent } from './types';
import { reforwardRef, cloneData, setOptions, setLabels, setDatasets } from './utils';
import { usePrevious, usePreviousRef } from '@/hooks';

function ChartComponent<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown
>(props: ChartProps<TType, TData, TLabel>, ref: ForwardedRef<ChartJS<TType, TData, TLabel>>) {
  const {
    height = 150,
    width = 300,
    redraw = false,
    datasetIdKey,
    type,
    data,
    options,
    plugins = [],
    fallbackContent,
    updateMode,
    ...canvasProps
  } = props as ChartProps;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(undefined);
  const previousDatasets = usePreviousRef(data.datasets);

  const renderChart = () => {
    if (!canvasRef.current) return;

    chartRef.current = new ChartJS(canvasRef.current, {
      type,
      data: cloneData(data, datasetIdKey),
      options: options && { ...options },
      plugins
    });

    reforwardRef(ref, chartRef.current as ChartJS<TType, TData, TLabel>);
  };

  const destroyChart = () => {
    reforwardRef(ref, null);

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
  };

  useEffect(() => {
    if (!redraw && chartRef.current && options) {
      setOptions(chartRef.current, options);
    }
  }, [redraw, options]);

  useEffect(() => {
    if (!redraw && chartRef.current) {
      setLabels(chartRef.current.config.data as any, data.labels);
    }
  }, [redraw, data.labels]);

  useEffect(() => {
    if (!redraw && chartRef.current && data.datasets) {
      setDatasets(chartRef.current.config.data as any, data.datasets, datasetIdKey);
    }
  }, [redraw, data.datasets]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (redraw) {
      destroyChart();
      setTimeout(renderChart);
    } else {
      try {
        chartRef.current?.update?.(updateMode);
      } catch (error) {
        console.error('Error updating chart', error, updateMode);
      }
    }
  }, [redraw, options, data.labels, data.datasets, updateMode]);

  useEffect(() => {
    if (!chartRef.current) return;

    destroyChart();
    setTimeout(renderChart);
  }, [type]);

  useEffect(() => {
    renderChart();

    return () => destroyChart();
  }, []);

  return (
    <canvas ref={canvasRef} role="img" height={height} width={width} {...canvasProps}>
      {fallbackContent}
    </canvas>
  );
}

export const Chart = forwardRef(ChartComponent) as BaseChartComponent;
