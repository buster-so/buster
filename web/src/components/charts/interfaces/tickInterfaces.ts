export type YAxisConfig = {
  yAxisShowAxisLabel?: boolean; //OPTIONAL: default is true.
  yAxisShowAxisTitle?: boolean; //OPTIONAL: default is true.
  yAxisAxisTitle?: string | null; //OPTIONAL: default is the name of the first column that is plotted on the Y-axis. Default is null.
  yAxisStartAxisAtZero?: boolean | null; //OPTIONAL: default is true.
  yAxisScaleType?: 'log' | 'linear'; //OPTIONAL: default is linear.
};

//The y2 (or right axis) Y-axis is used for secondary Y-axes in a combo chart.
export type Y2AxisConfig = {
  y2AxisShowAxisLabel?: boolean; //OPTIONAL: default is true.
  y2AxisShowAxisTitle?: boolean; //OPTIONAL: default is true.
  y2AxisAxisTitle?: string | null; //OPTIONAL: default is the name of the first column that is plotted on the Y-axis. Default is null.
  y2AxisStartAxisAtZero?: boolean; //OPTIONAL: default is true.
  y2AxisScaleType?: 'log' | 'linear'; //OPTIONAL: default is linear.
};

export type XAxisConfig = {
  xAxisTimeInterval?: 'day' | 'week' | 'month' | 'quarter' | 'year' | null; //OPTIONAL: default is null. Will only apply to combo and line charts
  xAxisShowAxisLabel?: boolean; //OPTIONAL: default is true.
  xAxisShowAxisTitle?: boolean; //OPTIONAL: default is true.
  xAxisAxisTitle?: string | null; //OPTIONAL: default is null. If null the axis title will be a concatenation of all the x columns applied to the axis.
  xAxisLabelRotation?: 0 | 45 | 90 | 'auto'; //OPTIONAL: default is auto.
  xAxisDataZoom?: boolean; //OPTIONAL: default is false. The LLM should never set this to true. Only the user can set this to true.
};

//The category axis works differently than the other axes. It is used to color and group the data.
export type CategoryAxisStyleConfig = {
  categoryAxisTitle?: string | null;
};
