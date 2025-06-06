'use client';

import type { ChartComponentLike, ChartType } from 'chart.js';
import {
  BarController,
  BubbleController,
  Chart as ChartJS,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController
} from 'chart.js';
import { forwardRef } from 'react';
import { Chart } from './chart';
import type { ChartJSOrUndefined, ChartProps, TypedChartComponent } from './types.js';

function createTypedChart<T extends ChartType>(type: T, registerables: ChartComponentLike) {
  ChartJS.register(registerables);
  const myRef = forwardRef<ChartJSOrUndefined<T>, Omit<ChartProps<T>, 'type'>>((props, ref) => (
    <Chart {...props} ref={ref} type={type} />
  ));
  myRef.displayName = `Chart${type}`;

  return myRef as TypedChartComponent<T>;
}

export const Line = /* #__PURE__ */ createTypedChart('line', LineController);

export const Bar = /* #__PURE__ */ createTypedChart('bar', BarController);

export const Radar = /* #__PURE__ */ createTypedChart('radar', RadarController);

export const Doughnut = /* #__PURE__ */ createTypedChart('doughnut', DoughnutController);

export const PolarArea = /* #__PURE__ */ createTypedChart('polarArea', PolarAreaController);

export const Bubble = /* #__PURE__ */ createTypedChart('bubble', BubbleController);

export const Pie = /* #__PURE__ */ createTypedChart('pie', PieController);

export const Scatter = /* #__PURE__ */ createTypedChart('scatter', ScatterController);
