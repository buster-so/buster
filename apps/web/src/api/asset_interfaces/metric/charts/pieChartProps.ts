import { z } from 'zod/v4';
import { PieChartAxisSchema } from './axisInterfaces';
import { PieSortBySchema } from './etcInterfaces';

export const PieChartPropsSchema = z.object({
  // OPTIONAL: default: value
  pieSortBy: PieSortBySchema,
  // Required for Pie
  pieChartAxis: PieChartAxisSchema,
  // OPTIONAL: default: number
  pieDisplayLabelAs: z.enum(['percent', 'number']).default('number'),
  // OPTIONAL: default true if donut width is set. If the data contains a percentage, set this as false.
  pieShowInnerLabel: z.boolean().default(true),
  // OPTIONAL: default: sum
  pieInnerLabelAggregate: z
    .enum(['sum', 'average', 'median', 'max', 'min', 'count'])
    .default('sum'),
  // OPTIONAL: default is null and will be the name of the pieInnerLabelAggregate
  pieInnerLabelTitle: z.string().optional(),
  // OPTIONAL: default: outside
  pieLabelPosition: z.nullable(z.enum(['inside', 'outside', 'none'])).default(null),
  // OPTIONAL: default: 55 | range 0-65 | range represents percent size of the donut hole. If user asks for a pie this should be 0
  pieDonutWidth: z
    .number()
    .min(0, 'Donut width must be at least 0')
    .max(65, 'Donut width must be at most 65')
    .default(40),
  // OPTIONAL: default: 2.5 | range 0-100 | If there are items that are less than this percentage of the pie, they combine to form a single slice.
  pieMinimumSlicePercentage: z
    .number()
    .min(0, 'Minimum slice percentage must be at least 0')
    .max(100, 'Minimum slice percentage must be at most 100')
    .default(0)
});

export type PieChartProps = z.infer<typeof PieChartPropsSchema>;
