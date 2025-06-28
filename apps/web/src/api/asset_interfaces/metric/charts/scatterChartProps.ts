import { z } from 'zod/v4';
import { ScatterAxisSchema } from './axisInterfaces';

export const ScatterChartPropsSchema = z.object({
  // Required for Scatter
  scatterAxis: ScatterAxisSchema.optional(),
  scatterDotSize: z.tuple([z.number(), z.number()]).default([3, 15]).optional()
});

export type ScatterChartProps = z.infer<typeof ScatterChartPropsSchema>;
