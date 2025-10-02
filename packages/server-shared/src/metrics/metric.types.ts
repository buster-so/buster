import { z } from 'zod';
import { ShareConfigSchema, VerificationStatusSchema } from '../share';
import { ChartConfigPropsSchema } from './charts';
import { DEFAULT_CHART_CONFIG } from './charts/chartConfigProps';
import { getDefaults } from './defaultHelpers';
import { DataMetadataSchema } from './metadata.type';

export const MetricSchema = z.object({
  id: z.string(),
  type: z.literal('metric_file'),
  name: z.string(),
  version_number: z.number(),
  description: z.string().nullable(),
  file_name: z.string(),
  time_frame: z.string(),
  data_source_id: z.string(),
  error: z.string().nullable(),
  chart_config: ChartConfigPropsSchema.default(DEFAULT_CHART_CONFIG),
  data_metadata: DataMetadataSchema,
  status: VerificationStatusSchema,
  evaluation_score: z.enum(['Moderate', 'High', 'Low']),
  evaluation_summary: z.string(),
  file: z.string(), // yaml file
  created_at: z.string(),
  updated_at: z.string(),
  sent_by_id: z.string(),
  sent_by_name: z.string(),
  sent_by_avatar_url: z.string().nullable(),
  sql: z.string().nullable(),
  dashboards: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
  collections: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
  versions: z.array(
    z.object({
      version_number: z.number(),
      updated_at: z.string(),
    })
  ),
  ...ShareConfigSchema.shape,
});

const FilterTokenModeSchema = z.enum([
  'predicate',
  'range',
  'in_list',
  'join_predicate',
  'partition_by',
  'qualify',
  'having',
  'order_by_item',
  'select_expr',
  'limit',
  'predicate_switch',
  'predicate_complex',
  'value',
]);

const FilterValidateSchema = z
  .object({
    enum: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
    regex: z.string().optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'validate must include at least one constraint when provided',
  })
  .optional();

const MetricFilterSchema = z
  .object({
    key: z.string(),
    column: z.string(),
    type: z.enum([
      'string',
      'number',
      'boolean',
      'string_list',
      'number_list',
      'date',
      'timestamp',
      'daterange',
      'timestamp_range',
    ]),
    op: z.enum(['=', '!=', '>', '>=', '<', '<=', 'like', 'ilike']).optional(),
    required: z.boolean().optional(),
    null_behavior: z.enum(['omit', 'no_op']).optional(),
    validate: FilterValidateSchema,
    mode: FilterTokenModeSchema.default('predicate'),
    needsLeadingAnd: z.boolean().optional(),
    default: z.unknown().optional(),
  })
  .superRefine((filter, ctx) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(filter.key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Filter key must only contain letters, numbers, underscores, or hyphens.',
        path: ['key'],
      });
    }
  });

export const MetricYmlSchema = z.object({
  name: z.string(),
  description: z.string(),
  timeFrame: z.string(),
  sql: z.string(),
  chartConfig: ChartConfigPropsSchema,
  filters: z.array(MetricFilterSchema).optional(),
});

export type MetricYml = z.infer<typeof MetricYmlSchema>;

export type MetricFilter = z.infer<typeof MetricFilterSchema>;

export type Metric = z.infer<typeof MetricSchema>;

export const DEFAULT_METRIC: Required<Metric> = getDefaults(MetricSchema);
