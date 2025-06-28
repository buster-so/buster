import { z } from 'zod/v4';

export const ChartTypeSchema = z
  .enum(['line', 'bar', 'scatter', 'pie', 'metric', 'table', 'combo'])
  .default('table');

export type ChartType = z.infer<typeof ChartTypeSchema>;

export const ChartTypePlottableSchema = z.enum(['line', 'bar', 'scatter', 'pie', 'combo']);
export type ChartTypePlottable = z.infer<typeof ChartTypePlottableSchema>;

export const SimplifiedColumnTypeSchema = z.enum(['number', 'text', 'date']).default('text');

export type SimplifiedColumnType = z.infer<typeof SimplifiedColumnTypeSchema>;
