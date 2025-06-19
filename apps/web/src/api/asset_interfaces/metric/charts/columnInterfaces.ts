export type ColumnSettings = {
  showDataLabels?: boolean; //OPTIONAL: default is false
  showDataLabelsAsPercentage?: boolean; //OPTIONAL: default is false
  columnVisualization?: 'bar' | 'line' | 'dot'; //OPTIONAL: default is null. These can be applied to any number column. If this is set to null, then the yAxisColumnVisualization will be inherited from the chart level.
} & LineColumnSettings &
  BarColumnSettings &
  DotColumnSettings;

type LineColumnSettings = {
  lineWidth?: number; //OPTIONAL: default is 2. This will only apply if the columnVisualization is set to 'line'.
  lineStyle?: 'area' | 'line'; //OPTIONAL: default is area. This will only apply if the columnVisualization is set to 'line' and it is a combo chart.
  lineType?: 'normal' | 'smooth' | 'step'; //OPTIONAL: default is normal. This will only apply if the columnVisualization is set to 'line'.
  lineSymbolSize?: number; //OPTIONAL: default is 0. The range is 0-10. If a user requests this, we recommend setting it at 2px to start. This will only apply if the columnVisualization is set to 'line'. The UI calls this "Dots on Line".
};

export type BarColumnSettings = {
  barRoundness?: number; //OPTIONAL: default is 8. This will only apply if the columnVisualization is set to 'bar'. The value represents the roundness of the bar. 0 is square, 50 is circular.
};

export type DotColumnSettings = {
  lineSymbolSize?: number; //OPTIONAL: default is 10. This will only apply if the columnVisualization is set to 'dot'. This represents the size range of the dots in pixels.
};
