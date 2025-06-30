import { z } from 'zod/v4';

export const DerivedMetricTitleSchema = z.object({
  // which column to use.
  columnId: z.string(),
  // whether to display to use the key or the value in the chart
  useValue: z.boolean(),
  // OPTIONAL: default is sum
  aggregate: z.enum(['sum', 'average', 'median', 'max', 'min', 'count', 'first']).default('sum')
});

export const MetricChartPropsSchema = z.object({
  // the column id to use for the value.
  metricColumnId: z.string().default(''),
  // OPTIONAL: default: sum
  metricValueAggregate: z
    .enum(['sum', 'average', 'median', 'max', 'min', 'count', 'first'])
    .default('sum'),
  // OPTIONAL: if undefined, the column id will be used and formatted
  metricHeader: z.nullable(z.union([z.string(), DerivedMetricTitleSchema])).default(null),
  // OPTIONAL: default is ''
  metricSubHeader: z.nullable(z.union([z.string(), DerivedMetricTitleSchema])).default(null),
  // OPTIONAL: default is null. If null then the metricColumnId will be used in conjunction with the metricValueAggregate. If not null, then the metricValueLabel will be used.
  metricValueLabel: z.nullable(z.string()).default(null)
});

export type DerivedMetricTitle = z.infer<typeof DerivedMetricTitleSchema>;
export type MetricChartProps = z.infer<typeof MetricChartPropsSchema>;
