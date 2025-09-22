import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

export const SUBMIT_THOUGHTS_TOOL_NAME = 'submitThoughts';

// Schema for SQL best practices self-review
const SqlBestPracticesReviewSchema = z.object({
  sqlDialectCompliance: z
    .string()
    .describe('Review of adherence to current SQL dialect guidance and syntax requirements'),
  querySimplicity: z
    .string()
    .describe('Assessment of query simplicity and clarity without overcomplication'),
  timeRangeHandling: z
    .string()
    .describe('Review of default time range assumptions and explicit time handling'),
  definedMetricsUsage: z
    .string()
    .describe('Assessment of prioritizing pre-defined metrics over custom SQL'),
  groupingAndAggregation: z
    .string()
    .describe('Review of proper GROUP BY, HAVING, and window function usage'),
  strictJoins: z
    .string()
    .describe('Assessment of joining only explicitly defined table relationships'),
  namingConventions: z
    .string()
    .describe('Review of fully qualified table names and column aliases usage'),
  dataCompleteness: z
    .string()
    .describe('Assessment of handling missing values and complete date ranges for time series'),
});

// Schema for filtering best practices self-review
const FilteringBestPracticesReviewSchema = z.object({
  directSpecificFilters: z
    .string()
    .describe('Review of using direct and specific filters that explicitly match target entities'),
  entityTypeValidation: z
    .string()
    .describe('Assessment of validating entity types before applying filters'),
  positiveFiltering: z
    .string()
    .describe('Review of avoiding negative filtering unless explicitly required'),
  scopeRespect: z
    .string()
    .describe('Assessment of respecting query scope without expanding unnecessarily'),
  appropriateFields: z
    .string()
    .describe('Review of using existing fields designed for the query intent'),
  hierarchicalClassifications: z
    .string()
    .describe(
      'Assessment of investigating hierarchical classifications before using text search, checking for dedicated classification fields over text search on composite fields'
    ),
  filterAccuracy: z.string().describe('Assessment of filter accuracy verification with executeSql'),
});

// Schema for precomputed metrics best practices self-review
const PrecomputedMetricsBestPracticesReviewSchema = z.object({
  scanningRequirement: z
    .string()
    .describe('Review of scanning database context for existing precomputed metrics first'),
  evaluationProcess: z
    .string()
    .describe('Assessment of systematic evaluation of all relevant precomputed metrics'),
  usageJustification: z
    .string()
    .describe('Review of justification for using or excluding each precomputed metric'),
  preferenceOverCustom: z
    .string()
    .describe('Assessment of preferring precomputed metrics over custom calculations'),
});

// Schema for aggregation best practices self-review
const AggregationBestPracticesReviewSchema = z.object({
  intentDetermination: z
    .string()
    .describe('Review of determining query aggregation intent (volume, frequency, proportion)'),
  functionSelection: z
    .string()
    .describe('Assessment of selecting appropriate aggregation functions (SUM, COUNT, etc.)'),
  validationWithExecuteSql: z
    .string()
    .describe('Review of validating aggregation choices with executeSql'),
  mostMeaningClarification: z
    .string()
    .describe('Assessment of clarifying the meaning of "most" in query context'),
  explanationProvided: z
    .string()
    .describe('Review of explaining why the chosen aggregation function was selected'),
});

// Schema for segment descriptor investigation best practices self-review (optional)
const SegmentDescriptorInvestigationReviewSchema = z
  .object({
    universalRequirement: z
      .string()
      .describe('Review of systematically investigating ALL descriptive fields for segments'),
    comprehensiveInventory: z
      .string()
      .describe('Assessment of creating complete inventory of descriptive fields'),
    systematicInvestigation: z
      .string()
      .describe('Review of systematic querying of every descriptive field'),
    qualityAssessment: z
      .string()
      .describe('Assessment of evaluating segment quality and logical coherence'),
    refinementProtocol: z
      .string()
      .describe('Review of segment refinement when quality issues are found'),
  })
  .optional()
  .describe('Required only if the SQL creates segments, groups, or classifications');

// Schema for bar chart best practices self-review (optional)
const BarChartBestPracticesReviewSchema = z
  .object({
    axisConfiguration: z
      .string()
      .describe('Review of critical axis configuration rule (X-axis: categories, Y-axis: values)'),
    orientationSelection: z
      .string()
      .describe('Assessment of appropriate chart orientation selection'),
    configurationConsistency: z
      .string()
      .describe('Review of consistent axis configuration regardless of bar layout'),
    reasoningExplanation: z
      .string()
      .describe('Assessment of explaining reasoning for axis configuration'),
  })
  .optional()
  .describe('Required only if the SQL is intended for a bar chart visualization');

// Schema for individual SQL query and its self-review
const SqlQueryReviewSchema = z.object({
  metricName: z.string().describe('Name or description of the metric this SQL query is for'),
  sqlQuery: z.string().describe('The final SQL statement for this metric'),
  sqlBestPractices: SqlBestPracticesReviewSchema.describe('Self-review against SQL best practices'),
  filteringBestPractices: FilteringBestPracticesReviewSchema.describe(
    'Self-review against filtering best practices'
  ),
  precomputedMetricsBestPractices: PrecomputedMetricsBestPracticesReviewSchema.describe(
    'Self-review against precomputed metrics best practices'
  ),
  aggregationBestPractices: AggregationBestPracticesReviewSchema.describe(
    'Self-review against aggregation best practices'
  ),
  segmentDescriptorInvestigation: SegmentDescriptorInvestigationReviewSchema.describe(
    'Self-review against segment descriptor investigation best practices (if applicable)'
  ),
  barChartBestPractices: BarChartBestPracticesReviewSchema.describe(
    'Self-review against bar chart best practices (if applicable)'
  ),
});

// Updated input schema to include SQL queries and self-reviews
const SubmitThoughtsInputSchema = z.object({
  sqlQueries: z
    .array(SqlQueryReviewSchema)
    .describe('Array of SQL queries with self-reviews for each planned metric')
    .optional(),
});

const SubmitThoughtsOutputSchema = z.object({});

// Optional context for consistency with other tools (e.g., messageId for future logging)
const SubmitThoughtsContextSchema = z.object({
  messageId: z.string().optional().describe('The message ID for tracking tool execution.'),
});

export type SubmitThoughtsInput = z.infer<typeof SubmitThoughtsInputSchema>;
export type SubmitThoughtsOutput = z.infer<typeof SubmitThoughtsOutputSchema>;
export type SubmitThoughtsContext = z.infer<typeof SubmitThoughtsContextSchema>;

async function processSubmitThoughts(input: SubmitThoughtsInput): Promise<SubmitThoughtsOutput> {
  // Process the SQL queries and self-reviews if provided
  if (input.sqlQueries && input.sqlQueries.length > 0) {
    // Log or process the SQL queries and self-reviews as needed
    // For now, we just validate that the input was received properly
    console.log(`Received ${input.sqlQueries.length} SQL queries with self-reviews`);
  }
  return {};
}

function createSubmitThoughtsExecute() {
  return wrapTraced(
    async (input: SubmitThoughtsInput): Promise<SubmitThoughtsOutput> => {
      return await processSubmitThoughts(input);
    },
    { name: 'Submit Thoughts' }
  );
}

// Factory: returns a tool definition that can accept SQL queries and self-reviews
export function createSubmitThoughtsTool() {
  const execute = createSubmitThoughtsExecute();

  return tool({
    description:
      'Confirms that the agent has finished thinking through all of its steps and is ready to move on to the next phase of the workflow. When submitting thoughts, the agent should include final SQL statements for each planned metric along with a comprehensive self-review of how well each SQL query follows the established best practices for SQL development, filtering, precomputed metrics usage, aggregation, segment descriptor investigation, and bar chart configuration.',
    inputSchema: SubmitThoughtsInputSchema,
    outputSchema: SubmitThoughtsOutputSchema,
    execute,
  });
}
