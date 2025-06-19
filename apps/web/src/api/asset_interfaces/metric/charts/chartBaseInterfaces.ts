//ONLY USED IN COMPONENTS
export type BusterChartPropsBase = {
  onMounted: () => void;
  onInitialAnimationEnd: () => void;
  className?: string;
  animate?: boolean;
  data: Record<string, string | null | Date | number>[];
  isDarkMode?: boolean;
  readOnly?: boolean;
};
