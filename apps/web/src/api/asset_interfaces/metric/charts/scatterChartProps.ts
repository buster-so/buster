import { z } from 'zod/v4';
import { ScatterAxisSchema } from './axisInterfaces';

export const ScatterChartPropsSchema = z.object({
  // Required for Scatter
  scatterAxis: ScatterAxisSchema,
  scatterDotSize: z.tuple([z.number(), z.number()]).default([3, 15])
});

export type ScatterChartProps = z.infer<typeof ScatterChartPropsSchema>;
