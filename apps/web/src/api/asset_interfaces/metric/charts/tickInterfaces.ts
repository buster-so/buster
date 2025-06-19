/**
 * Configuration options for the Y-axis of a chart.
 */
export type YAxisConfig = {
  /** Whether to show the axis label. Defaults to true. */
  yAxisShowAxisLabel?: boolean;

  /** Whether to show the axis title. Defaults to true. */
  yAxisShowAxisTitle?: boolean;

  /**
   * The title of the Y-axis.
   * @default null - Uses the name of the first column plotted on the Y-axis
   */
  yAxisAxisTitle?: string | null;

  /** Whether to start the axis at zero. Defaults to true. */
  yAxisStartAxisAtZero?: boolean | null;

  /**
   * The scale type for the Y-axis.
   * @default "linear"
   */
  yAxisScaleType?: 'log' | 'linear';
};

//The y2 (or right axis) Y-axis is used for secondary Y-axes in a combo chart.
/**
 * Configuration options for the secondary Y-axis (Y2) in a combo chart.
 */
export type Y2AxisConfig = {
  /** Whether to show the axis label. Defaults to true. */
  y2AxisShowAxisLabel?: boolean;

  /** Whether to show the axis title. Defaults to true. */
  y2AxisShowAxisTitle?: boolean;

  /**
   * The title of the secondary Y-axis.
   * @default null - Uses the name of the first column plotted on the Y2-axis
   */
  y2AxisAxisTitle?: string | null;

  /** Whether to start the axis at zero. Defaults to true. */
  y2AxisStartAxisAtZero?: boolean;

  /**
   * The scale type for the secondary Y-axis.
   * @default "linear"
   */
  y2AxisScaleType?: 'log' | 'linear';
};

/**
 * Configuration options for the X-axis of a chart.
 */
export type XAxisConfig = {
  /**
   * The time interval for the X-axis. Only applies to combo and line charts.
   * @default null
   */
  xAxisTimeInterval?: 'day' | 'week' | 'month' | 'quarter' | 'year' | null;

  /** Whether to show the axis label. Defaults to true. */
  xAxisShowAxisLabel?: boolean;

  /** Whether to show the axis title. Defaults to true. */
  xAxisShowAxisTitle?: boolean;

  /**
   * The title of the X-axis.
   * @default null - Uses a concatenation of all X columns applied to the axis
   */
  xAxisAxisTitle?: string | null;

  /**
   * The rotation angle for the X-axis labels.
   * @default "auto"
   */
  xAxisLabelRotation?: 0 | 45 | 90 | 'auto';

  /**
   * Whether to enable data zooming on the X-axis.
   * Should only be set to true by the user.
   * @default false
   */
  xAxisDataZoom?: boolean;
};

//The category axis works differently than the other axes. It is used to color and group the data.
/**
 * Configuration options for styling the category axis.
 * The category axis is used to color and group the data.
 */
export type CategoryAxisStyleConfig = {
  /**
   * The title of the category axis.
   * @default null
   */
  categoryAxisTitle?: string | null;
};
