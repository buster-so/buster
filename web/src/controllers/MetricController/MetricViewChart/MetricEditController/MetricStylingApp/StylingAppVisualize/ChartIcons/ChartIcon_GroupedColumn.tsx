import type React from 'react';
import { DEFAULT_CHART_COLORS, DISABLED_CHART_COLORS } from '../config';

export const ChartIcon_GroupedColumn: React.FC<{ colors?: string[]; disabled?: boolean }> = ({
  colors: colorsProp = DEFAULT_CHART_COLORS,
  disabled
}) => {
  const colors = disabled ? DISABLED_CHART_COLORS : colorsProp;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="23" height="22" viewBox="0 0 23 22" fill="none">
      <title>Grouped Column Chart Icon</title>
      <path
        d="M0.666992 4C0.666992 3.44771 1.11471 3 1.66699 3H3.66699C4.21928 3 4.66699 3.44772 4.66699 4V22H0.666992V4Z"
        fill={colors[0]}
      />
      <path
        d="M5.66699 14C5.66699 13.4477 6.11471 13 6.66699 13H8.66699C9.21928 13 9.66699 13.4477 9.66699 14V22H5.66699V14Z"
        fill={colors[1]}
      />
      <path
        d="M13.667 1C13.667 0.447716 14.1147 0 14.667 0H16.667C17.2193 0 17.667 0.447715 17.667 1V22H13.667V1Z"
        fill={colors[0]}
      />
      <path
        d="M18.667 7C18.667 6.44772 19.1147 6 19.667 6H21.667C22.2193 6 22.667 6.44772 22.667 7V22H18.667V7Z"
        fill={colors[1]}
      />
    </svg>
  );
};
