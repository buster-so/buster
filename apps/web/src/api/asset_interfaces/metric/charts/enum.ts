export enum ChartType {
  Line = 'line',
  Bar = 'bar',
  Scatter = 'scatter',
  Pie = 'pie',
  Metric = 'metric',
  Table = 'table',
  Combo = 'combo'
}

export type ChartTypePlottable =
  | ChartType.Line
  | ChartType.Bar
  | ChartType.Scatter
  | ChartType.Pie
  | ChartType.Combo;
