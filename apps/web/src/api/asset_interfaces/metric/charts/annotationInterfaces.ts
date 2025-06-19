//Goal line is a line that is drawn on the chart to represent a goal.
export interface GoalLine {
  show: boolean; //OPTIONAL: default is false. this should only be used if the user explicitly requests a goal line
  value: number; //OPTIONAL: default is null. it should remain null until the user specifies what the goal line value should be.
  showGoalLineLabel: boolean; //OPTIONAL: default is true.
  goalLineLabel: string | null; //OPTIONAL: if showGoalLineLabel is true, this will be the label. default is "Goal".
  goalLineColor?: string | null; //OPTIONAL: default is #000000
}

export interface Trendline {
  show: boolean; //OPTIONAL: default is true. this should only be used if the user explicitly requests a trendline
  showTrendlineLabel: boolean; //OPTIONAL: default is true
  trendlineLabel: string | null; //OPTIONAL: if showTrendlineLabel is true, this will be the label
  type:
    | 'average'
    | 'linear_regression'
    | 'logarithmic_regression'
    | 'exponential_regression'
    | 'polynomial_regression'
    | 'min'
    | 'max'
    | 'median'; //default is linear trend
  trendLineColor?: string | null | 'inherit'; //OPTIONAL: default is #000000, inherit will inherit the color from the line/bar
  columnId: string;
  trendlineLabelPositionOffset?: number; //OPTIONAL: default is 0.85. Goes from 0 to 1. This is where the label will be placed on the trendline.
  projection?: boolean; //OPTIONAL: default is false. if true, the trendline will be projected to the end of the chart.
  lineStyle?: 'solid' | 'dotted' | 'dashed' | 'dashdot';
  offset?: number; //OPTIONAL: default is 0. if true, the label will be offset vertically from the trendline.
  polynomialOrder?: number;
  aggregateAllCategories?: boolean; //OPTIONAL: default is true. if true, the trendline will be calculated for all categories. if false, the trendline will be calculated for the category specified in the columnId.
  id?: string;
}
