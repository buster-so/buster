import { z } from 'zod/v4';

// Goal line is a line that is drawn on the chart to represent a goal.
export const GoalLineSchema = z.object({
  // OPTIONAL: default is false. this should only be used if the user explicitly requests a goal line
  show: z.boolean().default(false),
  // OPTIONAL: default is null. it should remain null until the user specifies what the goal line value should be.
  value: z.nullable(z.number()).default(null).optional(),
  // OPTIONAL: default is true.
  showGoalLineLabel: z.boolean().default(true).optional(),
  // OPTIONAL: if showGoalLineLabel is true, this will be the label. default is "Goal".
  goalLineLabel: z.nullable(z.string()).default('Goal').optional(),
  // OPTIONAL: default is #000000
  goalLineColor: z.nullable(z.string()).default('#000000').optional()
});

export const TrendlineSchema = z.object({
  // OPTIONAL: default is true. this should only be used if the user explicitly requests a trendline
  show: z.boolean().default(true).optional(),
  // OPTIONAL: default is true
  showTrendlineLabel: z.boolean().default(true).optional(),
  // OPTIONAL: if showTrendlineLabel is true, this will be the label
  trendlineLabel: z.nullable(z.string()).default(null).optional(),
  // default is linear trend
  type: z
    .enum([
      'average',
      'linear_regression',
      'logarithmic_regression',
      'exponential_regression',
      'polynomial_regression',
      'min',
      'max',
      'median'
    ])
    .default('linear_regression'),
  // OPTIONAL: default is #000000, inherit will inherit the color from the line/bar
  trendLineColor: z
    .union([z.nullable(z.string()), z.literal('inherit')])
    .default('#000000')
    .optional(),
  columnId: z.string(),
  // OPTIONAL: default is 0.85. Goes from 0 to 1. This is where the label will be placed on the trendline.
  trendlineLabelPositionOffset: z.number().default(0.85).optional(),
  // OPTIONAL: default is false. if true, the trendline will be projected to the end of the chart.
  projection: z.boolean().default(false).optional(),
  lineStyle: z.enum(['solid', 'dotted', 'dashed', 'dashdot']).default('solid').optional(),
  // OPTIONAL: default is 0. if true, the label will be offset vertically from the trendline.
  offset: z.number().default(0).optional(),
  polynomialOrder: z.number().default(2).optional(),
  // OPTIONAL: default is true. if true, the trendline will be calculated for all categories. if false, the trendline will be calculated for the category specified in the columnId.
  aggregateAllCategories: z.boolean().default(true).optional(),
  id: z.string().optional()
});

// Export inferred types
export type GoalLine = z.infer<typeof GoalLineSchema>;
export type Trendline = z.infer<typeof TrendlineSchema>;
