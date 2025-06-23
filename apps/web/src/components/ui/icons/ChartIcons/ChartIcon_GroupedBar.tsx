import type React from 'react';
import { DEFAULT_CHART_COLORS, DISABLED_CHART_COLORS } from './config';

export const ChartIcon_GroupedBar: React.FC<{ colors?: string[]; disabled?: boolean }> = ({
  colors: colorsProp = DEFAULT_CHART_COLORS,
  disabled
}) => {
  const colors = disabled ? DISABLED_CHART_COLORS : colorsProp;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 23 22"
      fill="none">
      <title>Grouped Bar Chart Icon</title>
      <path
        d="M18.667 0C19.2193 0 19.667 0.447715 19.667 1V3C19.667 3.55228 19.2193 4 18.667 4L0.666992 4V0L18.667 0Z"
        fill={colors[0]}
      />
      <path
        d="M8.66699 5C9.21928 5 9.66699 5.44772 9.66699 6V8C9.66699 8.55228 9.21928 9 8.66699 9H0.666992V5L8.66699 5Z"
        fill={colors[1]}
      />
      <path
        d="M21.667 13C22.2193 13 22.667 13.4477 22.667 14V16C22.667 16.5523 22.2193 17 21.667 17H0.666992V13L21.667 13Z"
        fill={colors[0]}
      />
      <path
        d="M15.667 18C16.2193 18 16.667 18.4477 16.667 19V21C16.667 21.5523 16.2193 22 15.667 22H0.666992V18H15.667Z"
        fill={colors[1]}
      />
    </svg>
  );
};
