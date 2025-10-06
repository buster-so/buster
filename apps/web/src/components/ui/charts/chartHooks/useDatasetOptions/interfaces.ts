export interface KV {
  key: string;
  value: string | number | boolean | null;
  categoryValue?: string;
  categoryKey?: string;
}

/**
 * Configuration options for a dataset to be displayed in a chart
 */
export type DatasetOption = {
  /** Unique identifier for the dataset */
  id: string;
  /**
   * Label information for each data point in the dataset
   * Contains an array of KV pairs
   * In non-scatter mode, each inner array will have only one element
   * The label represents the category or y-axis value of the data point
   */
  label: KV[];
  /**
   * The actual numerical values to be plotted in the chart
   * Can contain null for missing data points
   */
  data: (number | null)[];
  /**
   * The key used to reference this dataset (typically matches a property name in source data)
   */
  dataKey: string;
  /**
   * Determines which axis this dataset should be plotted against
   * 'y' for primary y-axis, 'y2' for secondary y-axis
   */
  axisType: 'y' | 'y2';
  /**
   * Additional information to display in tooltips when hovering over data points
   * Contains an array of KV pairs for each data point
   */
  tooltipData: KV[][];
  /**
   * Optional array of size values corresponding to each data point
   * Used when 'axis.size' is provided to determine point dimensions
   */
  sizeData?: (number | null)[];
  /**
   * Optional array of ticks for scatter plot data points
   * Each inner array contains the x-axis values for that point
   */
  ticksForScatter?: (string | number)[][];
  /**
   * Optional key to determine the size of data points (used in scatter/bubble charts)
   */
  sizeDataKey?: string;
  /**
   * Optional color by value
   */
  colors?: string[] | string; //if the color is overridden, if its an array each color is a color for a data point
};

export type DatasetOptionsWithTicks = {
  ticks: (string | number)[][]; //ticks will be empty for scatter plots
  ticksKey: KV[];
  datasets: DatasetOption[];
};
