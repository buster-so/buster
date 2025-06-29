import { DEFAULT_CHART_THEME } from './configColors';
import { BusterChartConfigPropsSchema, type BusterChartConfigProps } from './chartConfigProps';
import { z } from 'zod/v4';

/**
 * Extracts all default values from a Zod schema.
 * This function creates a partial version of the schema where all fields are optional,
 * then parses an empty object to get all the default values.
 */
function getDefaults<T extends z.ZodObject<z.ZodRawShape>>(schema: T): z.infer<T> {
  // Create a partial version of the schema where all fields are optional
  const partialSchema = schema.partial();

  // Parse an empty object through the partial schema
  // This will apply all default values without throwing on missing required fields
  const defaults = partialSchema.parse({});

  // Now try to parse the defaults through the original schema
  // This ensures we get the correct type and validates the defaults
  try {
    return schema.parse(defaults);
  } catch {
    // If the original schema fails (missing required fields without defaults),
    // return what we have as a partial
    return defaults as z.infer<T>;
  }
}

/**
 * Alternative implementation that only returns fields with explicit defaults.
 * This is useful when you want to know which fields have defaults vs which are undefined.
 */
function getDefaultsPartial<T extends z.ZodObject<z.ZodRawShape>>(schema: T): Partial<z.infer<T>> {
  // Make all fields optional and parse an empty object
  const partialSchema = schema.partial();
  return partialSchema.parse({}) as Partial<z.infer<T>>;
}

export const DEFAULT_CHART_CONFIG: BusterChartConfigProps = getDefaults(
  BusterChartConfigPropsSchema
);

// export const DEFAULT_CHART_CONFIG: BusterChartConfigProps = {
//   colors: DEFAULT_CHART_THEME,
//   selectedChartType: 'table',
//   yAxisShowAxisLabel: true,
//   yAxisShowAxisTitle: true,
//   yAxisAxisTitle: null,
//   yAxisStartAxisAtZero: null,
//   yAxisScaleType: 'linear',
//   y2AxisShowAxisLabel: true,
//   y2AxisAxisTitle: null,
//   y2AxisShowAxisTitle: true,
//   y2AxisStartAxisAtZero: true,
//   y2AxisScaleType: 'linear',
//   xAxisTimeInterval: null,
//   xAxisShowAxisLabel: true,
//   xAxisShowAxisTitle: true,
//   xAxisAxisTitle: null,
//   xAxisLabelRotation: 'auto',
//   xAxisDataZoom: false,
//   categoryAxisTitle: null,
//   showLegend: null,
//   gridLines: true,
//   goalLines: [],
//   trendlines: [],
//   showLegendHeadline: false,
//   disableTooltip: false,
//   barAndLineAxis: {
//     x: [],
//     y: [],
//     category: [],
//     tooltip: null
//   },
//   scatterAxis: {
//     x: [],
//     y: [],
//     size: [],
//     tooltip: null
//   },
//   comboChartAxis: {
//     x: [],
//     y: [],
//     y2: [],
//     tooltip: null
//   },
//   pieChartAxis: {
//     x: [],
//     y: [],
//     tooltip: null
//   },
//   //LINE
//   lineGroupType: null,
//   //SCATTER
//   scatterDotSize: [3, 15],
//   //BAR
//   barSortBy: [],
//   barLayout: 'vertical',
//   barGroupType: 'group',
//   barShowTotalAtTop: false,
//   //PIE
//   pieShowInnerLabel: true,
//   pieInnerLabelAggregate: 'sum',
//   pieInnerLabelTitle: 'Total',
//   pieLabelPosition: null,
//   pieDonutWidth: 40,
//   pieMinimumSlicePercentage: 0,
//   pieDisplayLabelAs: 'number',
//   pieSortBy: 'value',
//   //METRIC
//   metricColumnId: '',
//   metricValueAggregate: 'sum',
//   metricHeader: null,
//   metricSubHeader: null,
//   metricValueLabel: null,
//   //TABLE
//   tableColumnOrder: null,
//   tableColumnWidths: null,
//   tableHeaderBackgroundColor: null,
//   tableHeaderFontColor: null,
//   tableColumnFontColor: null,
//   //MUST LOOP THROUGH ALL COLUMNS
//   columnSettings: {},
//   columnLabelFormats: {}
// };
