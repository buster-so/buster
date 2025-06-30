import { z } from 'zod/v4';
import { BarAndLineAxisSchema } from './axisInterfaces';
import { BarSortBySchema } from './etcInterfaces';

export const BarChartPropsSchema = z.object({
  // Required for Bar
  barAndLineAxis: BarAndLineAxisSchema,
  // OPTIONAL: default: vertical (column chart)
  barLayout: z.enum(['horizontal', 'vertical']).default('vertical'),
  // OPTIONAL
  barSortBy: BarSortBySchema,
  // OPTIONAL: default is group. This will only apply if the columnVisualization is set to 'bar'.
  barGroupType: z.nullable(z.enum(['stack', 'group', 'percentage-stack'])).default('group'),
  // OPTIONAL: default is false. This will only apply if is is stacked and there is either a category or multiple y axis applie to the series.
  barShowTotalAtTop: z.boolean().default(false)
});

export type BarChartProps = z.infer<typeof BarChartPropsSchema>;
