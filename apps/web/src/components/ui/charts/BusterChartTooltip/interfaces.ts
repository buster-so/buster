export type TooltipItemValueProps = {
  formattedValue: number | string;
  formattedLabel: string;
  formattedPercentage: string | undefined;
};
export type ITooltipItem = {
  color: string | undefined;
  seriesType: string;
  formattedLabel: string;
  values: TooltipItemValueProps[];
  usePercentage: boolean;
  hidden?: boolean;
};
