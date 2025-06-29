import { z } from 'zod/v4';

/**
 * Configuration options for the Y-axis of a chart.
 */
export const YAxisConfigSchema = z.object({
  // Whether to show the axis label. Defaults to true.
  yAxisShowAxisLabel: z.boolean().default(true),
  // Whether to show the axis title. Defaults to true.
  yAxisShowAxisTitle: z.boolean().default(true),
  // The title of the Y-axis. @default null - Uses the name of the first column plotted on the Y-axis
  yAxisAxisTitle: z.nullable(z.string()).default(null),
  // Whether to start the axis at zero. Defaults to null.
  yAxisStartAxisAtZero: z.nullable(z.boolean()).default(null),
  // The scale type for the Y-axis. @default "linear"
  yAxisScaleType: z.enum(['log', 'linear']).default('linear')
});

//The y2 (or right axis) Y-axis is used for secondary Y-axes in a combo chart.
/**
 * Configuration options for the secondary Y-axis (Y2) in a combo chart.
 */
export const Y2AxisConfigSchema = z.object({
  // Whether to show the axis label. Defaults to true.
  y2AxisShowAxisLabel: z.boolean().default(true),
  // Whether to show the axis title. Defaults to true.
  y2AxisShowAxisTitle: z.boolean().default(true),
  // The title of the secondary Y-axis. @default null - Uses the name of the first column plotted on the Y2-axis
  y2AxisAxisTitle: z.nullable(z.string()).default(null),
  // Whether to start the axis at zero. Defaults to true.
  y2AxisStartAxisAtZero: z.boolean().default(true),
  // The scale type for the secondary Y-axis. @default "linear"
  y2AxisScaleType: z.enum(['log', 'linear']).default('linear')
});

/**
 * Configuration options for the X-axis of a chart.
 */
export const XAxisConfigSchema = z.object({
  // The time interval for the X-axis. Only applies to combo and line charts. @default null
  xAxisTimeInterval: z.nullable(z.enum(['day', 'week', 'month', 'quarter', 'year'])).default(null),
  // Whether to show the axis label. Defaults to true.
  xAxisShowAxisLabel: z.boolean().default(true),
  // Whether to show the axis title. Defaults to true.
  xAxisShowAxisTitle: z.boolean().default(true),
  // The title of the X-axis. @default null - Uses a concatenation of all X columns applied to the axis
  xAxisAxisTitle: z.nullable(z.string()).default(null),
  // The rotation angle for the X-axis labels. @default "auto"
  xAxisLabelRotation: z
    .union([z.literal(0), z.literal(45), z.literal(90), z.literal('auto')])
    .default('auto'),
  // Whether to enable data zooming on the X-axis. Should only be set to true by the user. @default false
  xAxisDataZoom: z.boolean().default(false)
});

//The category axis works differently than the other axes. It is used to color and group the data.
/**
 * Configuration options for styling the category axis.
 * The category axis is used to color and group the data.
 */
export const CategoryAxisStyleConfigSchema = z.object({
  // The title of the category axis. @default null
  categoryAxisTitle: z.nullable(z.string()).default(null)
});

// Export inferred types
export type YAxisConfig = z.infer<typeof YAxisConfigSchema>;
export type Y2AxisConfig = z.infer<typeof Y2AxisConfigSchema>;
export type XAxisConfig = z.infer<typeof XAxisConfigSchema>;
export type CategoryAxisStyleConfig = z.infer<typeof CategoryAxisStyleConfigSchema>;
