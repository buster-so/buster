import { z } from 'zod/v4';
import { GoalLineSchema, TrendlineSchema } from './annotationInterfaces';
import { ColumnSettingsSchema } from './columnInterfaces';
import { IColumnLabelFormatSchema } from './columnLabelInterfaces';
import { ChartTypeSchema } from './enum';
import { ShowLegendHeadlineSchema } from './etcInterfaces';
import {
  CategoryAxisStyleConfigSchema,
  XAxisConfigSchema,
  Y2AxisConfigSchema,
  YAxisConfigSchema
} from './tickInterfaces';
import { DEFAULT_CHART_THEME } from './configColors';
import { BarChartPropsSchema } from './barChartProps';
import { LineChartPropsSchema } from './lineChartProps';
import { ScatterChartPropsSchema } from './scatterChartProps';
import { PieChartPropsSchema } from './pieChartProps';
import { TableChartPropsSchema } from './tableChartProps';
import { ComboChartPropsSchema } from './comboChartProps';
import { MetricChartPropsSchema, DerivedMetricTitleSchema } from './metricChartProps';

export const BusterChartConfigPropsSchema = z.object({
  selectedChartType: ChartTypeSchema,
  // COLUMN SETTINGS
  // OPTIONAL because the defaults will be determined by the UI
  columnSettings: z.record(z.string(), z.optional(ColumnSettingsSchema)).default({}).optional(),
  columnLabelFormats: z
    .record(z.string(), z.optional(IColumnLabelFormatSchema))
    .default({})
    .optional(),
  // OPTIONAL: default is the buster color palette
  colors: z.array(z.string()).default(DEFAULT_CHART_THEME).optional(),
  // OPTIONAL: default is null and will be true if there are multiple Y axes or if a category axis is used
  showLegend: z.nullable(z.boolean()).default(null).optional(),
  // OPTIONAL: default: true
  gridLines: z.boolean().default(true).optional(),
  // OPTIONAL
  showLegendHeadline: ShowLegendHeadlineSchema.optional(),
  // OPTIONAL: default is no goal lines
  goalLines: z.array(GoalLineSchema).default([]).optional(),
  // OPTIONAL: default is no trendlines
  trendlines: z.array(TrendlineSchema).default([]).optional(),
  // OPTIONAL: default is false
  disableTooltip: z.boolean().default(false).optional(),
  // Spread the shape properties from all schemas
  ...YAxisConfigSchema.shape,
  ...XAxisConfigSchema.shape,
  ...CategoryAxisStyleConfigSchema.shape,
  ...Y2AxisConfigSchema.shape,
  ...BarChartPropsSchema.shape,
  ...LineChartPropsSchema.shape,
  ...ScatterChartPropsSchema.shape,
  ...PieChartPropsSchema.shape,
  ...TableChartPropsSchema.shape,
  ...ComboChartPropsSchema.shape,
  ...MetricChartPropsSchema.shape
});

// Re-export schemas for backward compatibility
export {
  BarChartPropsSchema,
  LineChartPropsSchema,
  ScatterChartPropsSchema,
  PieChartPropsSchema,
  TableChartPropsSchema,
  ComboChartPropsSchema,
  MetricChartPropsSchema,
  DerivedMetricTitleSchema
};

// Export original types for backward compatibility
export type BusterChartConfigProps = z.infer<typeof BusterChartConfigPropsSchema>;
export type DerivedMetricTitle = z.infer<typeof DerivedMetricTitleSchema>;
export type MetricChartProps = z.infer<typeof MetricChartPropsSchema>;
export type BarChartProps = z.infer<typeof BarChartPropsSchema>;
export type LineChartProps = z.infer<typeof LineChartPropsSchema>;
export type ScatterChartProps = z.infer<typeof ScatterChartPropsSchema>;
export type PieChartProps = z.infer<typeof PieChartPropsSchema>;
export type TableChartProps = z.infer<typeof TableChartPropsSchema>;
export type ComboChartProps = z.infer<typeof ComboChartPropsSchema>;
