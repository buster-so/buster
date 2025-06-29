import { z } from 'zod/v4';

export const LineColumnSettingsSchema = z.object({
  // OPTIONAL: default is 2. This will only apply if the columnVisualization is set to 'line'.
  lineWidth: z
    .number()
    .min(1, 'Line width must be at least 1')
    .max(20, 'Line width must be at most 20')
    .default(2),
  // OPTIONAL: default is area. This will only apply if the columnVisualization is set to 'line' and it is a combo chart.
  lineStyle: z.enum(['area', 'line']).default('line'),
  // OPTIONAL: default is normal. This will only apply if the columnVisualization is set to 'line'.
  lineType: z.enum(['normal', 'smooth', 'step']).default('normal'),
  // OPTIONAL: default is 0. The range is 0-10. If a user requests this, we recommend setting it at 2px to start. This will only apply if the columnVisualization is set to 'line'. The UI calls this "Dots on Line".
  lineSymbolSize: z
    .number()
    .min(0, 'Line symbol size must be at least 0')
    .max(10, 'Line symbol size must be at most 10')
    .default(0)
});

export const BarColumnSettingsSchema = z.object({
  // OPTIONAL: default is 8. This will only apply if the columnVisualization is set to 'bar'. The value represents the roundness of the bar. 0 is square, 50 is circular.
  barRoundness: z
    .number()
    .min(0, 'Bar roundness must be at least 0')
    .max(50, 'Bar roundness must be at most 50')
    .default(8)
});

export const DotColumnSettingsSchema = z.object({
  // OPTIONAL: default is 10. This will only apply if the columnVisualization is set to 'dot'. This represents the size range of the dots in pixels.
  lineSymbolSize: z
    .number()
    .min(1, 'Dot symbol size must be at least 1')
    .max(50, 'Dot symbol size must be at most 50')
    .default(10)
});

export const ColumnSettingsSchema = z.object({
  // OPTIONAL: default is false
  showDataLabels: z.boolean().default(false),
  // OPTIONAL: default is false
  showDataLabelsAsPercentage: z.boolean().default(false),
  // OPTIONAL: default is null. These can be applied to any number column. If this is set to null, then the yAxisColumnVisualization will be inherited from the chart level.
  columnVisualization: z.enum(['bar', 'line', 'dot']).default('bar'),
  // LineColumnSettings properties
  // OPTIONAL: default is 2. This will only apply if the columnVisualization is set to 'line'.
  lineWidth: z
    .number()
    .min(1, 'Line width must be at least 1')
    .max(20, 'Line width must be at most 20')
    .default(2),
  // OPTIONAL: default is area. This will only apply if the columnVisualization is set to 'line' and it is a combo chart.
  lineStyle: z.enum(['area', 'line']).default('line'),
  // OPTIONAL: default is normal. This will only apply if the columnVisualization is set to 'line'.
  lineType: z.enum(['normal', 'smooth', 'step']).default('normal'),
  // OPTIONAL: default varies by visualization type - 0 for 'line' (Dots on Line), 10 for 'dot' (dot size in pixels)
  lineSymbolSize: z
    .number()
    .min(0, 'Symbol size must be at least 0')
    .max(50, 'Symbol size must be at most 50')
    .default(0),
  // BarColumnSettings properties
  // OPTIONAL: default is 8. This will only apply if the columnVisualization is set to 'bar'. The value represents the roundness of the bar. 0 is square, 50 is circular.
  barRoundness: z
    .number()
    .min(0, 'Bar roundness must be at least 0')
    .max(50, 'Bar roundness must be at most 50')
    .default(8)
});

// Export inferred types
export type LineColumnSettings = z.infer<typeof LineColumnSettingsSchema>;
export type BarColumnSettings = z.infer<typeof BarColumnSettingsSchema>;
export type DotColumnSettings = z.infer<typeof DotColumnSettingsSchema>;
export type ColumnSettings = z.infer<typeof ColumnSettingsSchema>;
