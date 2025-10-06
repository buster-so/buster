import { z } from 'zod';

export const ColorBySchema = z.tuple([z.string()]).or(z.array(z.string()).length(0)).default([]);

export const BarAndLineAxisSchema = z
  .object({
    // the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
    x: z.array(z.string()).default([]),
    // the column ids to use for the y axis.
    y: z.array(z.string()).default([]),
    /**
     * Column IDs for category grouping - creates SEPARATE SERIES for each category value.
     *
     * CATEGORY vs COLORBY - Key Differences:
     * - CATEGORY: Creates multiple series/lines (one per unique value). Each appears in legend.
     * - COLORBY: Applies colors to elements within a SINGLE series based on values.
     *
     * Example: Monthly sales chart
     * - category=['region'] → 4 separate lines/bar groups (North, South, East, West)
     * - colorBy=['region'] → 1 series with bars colored by region
     *
     * THE LLM SHOULD NEVER SET MULTIPLE CATEGORY COLUMNS. ONLY THE USER CAN SET THIS.
     */
    category: z.array(z.string()).default([]),
    // if null the y axis will automatically be used, the y axis will be used for the tooltip.
    tooltip: z.nullable(z.array(z.string())).default(null),
    /**
     * Apply colors to chart elements based on a column's values.
     * Unlike 'category', this keeps all data in a single series with color differentiation.
     * Perfect for status indicators, priority levels, or categorical color coding.
     */
    colorBy: ColorBySchema,
  })
  .default({
    x: [],
    y: [],
    category: [],
    tooltip: null,
    colorBy: [],
  });

export const ScatterAxisSchema = z
  .object({
    // the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
    x: z.array(z.string()).default([]),
    // the column ids to use for the y axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple y axis columns. Only the user can set this.
    y: z.array(z.string()).default([]),
    /**
     * Column IDs for category grouping - creates SEPARATE SERIES of points for each category value.
     *
     * CATEGORY vs COLORBY - Key Differences:
     * - CATEGORY: Creates multiple point series (one per unique value). Each appears in legend.
     * - COLORBY: Colors all points in a SINGLE series based on column values.
     *
     * Example: Customer satisfaction vs response time
     * - category=['department'] → Separate point series for Sales, Support, Engineering
     * - colorBy=['priority'] → All points in one series, colored by priority level
     *
     * THE LLM SHOULD NEVER SET MULTIPLE CATEGORY COLUMNS. ONLY THE USER CAN SET THIS.
     */
    category: z.array(z.string()).default([]),
    // the column id to use for the size range of the dots. ONLY one column id should be provided.
    size: z.tuple([z.string()]).or(z.array(z.string()).length(0)).default([]),
    // if null the y axis will automatically be used, the y axis will be used for the tooltip.
    tooltip: z.nullable(z.array(z.string())).default(null),
  })
  .default({
    x: [],
    y: [],
    size: [],
    category: [],
    tooltip: null,
  });

export const ComboChartAxisSchema = z
  .object({
    // the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
    x: z.array(z.string()).default([]),
    // the column ids to use for the y axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple y axis columns. Only the user can set this.
    y: z.array(z.string()).default([]),
    // the column ids to use for the right y axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple y axis columns. Only the user can set this.
    y2: z.array(z.string()).default([]),
    /**
     * Column IDs for category grouping - creates SEPARATE SERIES for each category value.
     *
     * CATEGORY vs COLORBY - Key Differences:
     * - CATEGORY: Creates multiple series/lines (one per unique value). Each appears in legend.
     * - COLORBY: Applies colors to elements within a SINGLE series based on values.
     *
     * Example: Monthly sales chart
     * - category=['region'] → 4 separate lines/bar groups (North, South, East, West)
     * - colorBy=['region'] → 1 series with bars colored by region
     *
     * THE LLM SHOULD NEVER SET MULTIPLE CATEGORY COLUMNS. ONLY THE USER CAN SET THIS.
     */
    category: z.array(z.string()).default([]),
    // if null the y axis will automatically be used, the y axis will be used for the tooltip.
    tooltip: z.nullable(z.array(z.string())).default(null),
    /**
     * Apply colors to chart elements based on a column's values.
     * Unlike 'category', this keeps all data in a single series with color differentiation.
     * Perfect for status indicators, priority levels, or categorical color coding.
     */
    colorBy: ColorBySchema,
  })
  .default({
    x: [],
    y: [],
    y2: [],
    category: [],
    tooltip: null,
    colorBy: [],
  });

export const PieChartAxisSchema = z
  .object({
    // the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
    x: z.array(z.string()).default([]),
    // the column ids to use for the y axis. If multiple column ids are provided, they will appear as rings. The LLM should NEVER set multiple y axis columns. Only the user can set this.
    y: z.array(z.string()).default([]),
    // if null the y axis will automatically be used, the y axis will be used for the tooltip.
    tooltip: z.nullable(z.array(z.string())).default(null),
  })
  .default({
    x: [],
    y: [],
    tooltip: null,
  });

export const ChartEncodesSchema = z.union([
  BarAndLineAxisSchema,
  ScatterAxisSchema,
  PieChartAxisSchema,
  ComboChartAxisSchema,
]);

// Export inferred types
export type BarAndLineAxis = z.infer<typeof BarAndLineAxisSchema>;
export type ScatterAxis = z.infer<typeof ScatterAxisSchema>;
export type ComboChartAxis = z.infer<typeof ComboChartAxisSchema>;
export type PieChartAxis = z.infer<typeof PieChartAxisSchema>;
export type ChartEncodes = z.infer<typeof ChartEncodesSchema>;
export type ColorBy = z.infer<typeof ColorBySchema>;
