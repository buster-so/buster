export type BarAndLineAxis = {
  x: string[]; // the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
  y: string[]; // the column ids to use for the y axis.
  category: string[]; // the column ids to use for the category axis. If multiple column ids are provided, they will be grouped together. THE LLM SHOULD NEVER SET MULTIPLE CATEGORY COLUMNS. ONLY THE USER CAN SET THIS.
  tooltip?: string[] | null; // if null the y axis will automatically be used, the y axis will be used for the tooltip.
};

export type ScatterAxis = {
  x: string[]; //the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
  y: string[]; //the column ids to use for the y axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
  category?: string[]; //the column ids to use for the category axis. If multiple column ids are provided, they will be grouped together. THE LLM SHOULD NEVER SET MULTIPLE CATEGORY COLUMNS. ONLY THE USER CAN SET THIS.
  size?: [string] | []; //the column id to use for the size range of the dots. ONLY one column id should be provided.
  tooltip?: string[] | null; //if null the y axis will automatically be used, the y axis will be used for the tooltip.
};

export type ComboChartAxis = {
  x: string[]; //the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
  y: string[]; //the column ids to use for the y axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple y axis columns. Only the user can set this.
  y2?: string[]; //the column ids to use for the right y axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple y axis columns. Only the user can set this.
  category?: string[] | null; //the column ids to use for the category axis. If multiple column ids are provided, they will be grouped together. THE LLM SHOULD NEVER SET MULTIPLE CATEGORY COLUMNS. ONLY THE USER CAN SET THIS.
  tooltip?: string[] | null; //if null the y axis will automatically be used, the y axis will be used for the tooltip.
};

export type PieChartAxis = {
  x: string[]; //the column ids to use for the x axis. If multiple column ids are provided, they will be grouped together and summed. The LLM should NEVER set multiple x axis columns. Only the user can set this.
  y: string[]; //the column ids to use for the y axis. If multiple column ids are provided, they will appear as rings. The LLM should NEVER set multiple y axis columns. Only the user can set this.
  tooltip?: string[] | null; //if null the y axis will automatically be used, the y axis will be used for the tooltip.
};

export type ChartEncodes = BarAndLineAxis | ScatterAxis | PieChartAxis | ComboChartAxis;
