import { z } from 'zod/v4';

export const LineChartPropsSchema = z.object({
  // OPTIONAL: default is null. This will only apply if the columnVisualization is set to 'line'. If this is set to stack it will stack the lines on top of each other. The UI has this labeled as "Show as %"
  lineGroupType: z.enum(['stack', 'percentage-stack']).nullable().optional().default(null)
});

export type LineChartProps = z.infer<typeof LineChartPropsSchema>;
