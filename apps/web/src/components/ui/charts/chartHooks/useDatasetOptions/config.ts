export type DataItem = Record<string, string | number | Date | null>;

export const emptyDatasetOptions = () => ({
  datasetOptions: [],
  yAxisKeys: [],
  tooltipKeys: []
});

export const TRENDLINE_DELIMETER = '_🫷🥸🫸trend_';
export const GROUPING_SEPARATOR = ' - ';

export const createLinearTrendlineDatasetKey = (
  trendlineType:
    | 'linear_slope'
    | 'linear_regression'
    | 'exponential_regression'
    | 'polynomial_regression'
    | 'logarithmic_regression'
    | 'average'
    | 'min'
    | 'max'
    | 'median',
  columnId: string
) => `${columnId}${TRENDLINE_DELIMETER}${trendlineType}`;

export const extractTrendlineIdFromDatasetKey = (datasetKey: string) => {
  const split = datasetKey.split(TRENDLINE_DELIMETER);
  const columnId = split[0];
  const trendlineType = split[1];
  return { trendlineType, columnId };
};

export const TrendlineToEcMethod = {
  linear_trend: 'linear',
  exponential_regression: 'exponential',
  polynomial_regression: 'polynomial',
  logarithmic: 'logarithmic'
};

export const DATASET_IDS = {
  raw: 'raw',
  relativeStack: 'relative-stack',
  sortedByBar: 'sorted-by-bar',
  sortedByValue: 'sorted-by-value',
  rawWithDateNotDelimited: 'raw-with-date-not-delimited',
  pieMinimum: (yAxisKey: string) => `pie-minimum-${yAxisKey}`,
  //TRENDLINE IDS
  linearSlope: (columnId: string) => createLinearTrendlineDatasetKey('linear_slope', columnId),
  linearRegression: (columnId: string) =>
    createLinearTrendlineDatasetKey('linear_regression', columnId),
  exponentialRegression: (columnId: string) =>
    createLinearTrendlineDatasetKey('exponential_regression', columnId),
  polynomialRegression: (columnId: string) =>
    createLinearTrendlineDatasetKey('polynomial_regression', columnId),
  logarithmicRegression: (columnId: string) =>
    createLinearTrendlineDatasetKey('logarithmic_regression', columnId),
  average: (columnId: string) => createLinearTrendlineDatasetKey('average', columnId),
  min: (columnId: string) => createLinearTrendlineDatasetKey('min', columnId),
  max: (columnId: string) => createLinearTrendlineDatasetKey('max', columnId),
  median: (columnId: string) => createLinearTrendlineDatasetKey('median', columnId)
};
