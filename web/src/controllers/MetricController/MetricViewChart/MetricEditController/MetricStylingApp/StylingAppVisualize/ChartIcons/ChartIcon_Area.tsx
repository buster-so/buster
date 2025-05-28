import type React from 'react';
import { DEFAULT_CHART_COLORS, DISABLED_CHART_COLORS } from '../config';

export const ChartIcon_Area: React.FC<{ colors?: string[]; disabled?: boolean }> = ({
  colors: colorsProp = DEFAULT_CHART_COLORS,
  disabled
}) => {
  const colors = disabled ? DISABLED_CHART_COLORS : colorsProp;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="23" height="22" viewBox="0 0 23 22" fill="none">
      <g clipPath="url(#clip0_257_1019)">
        <path
          d="M0.666992 14.5L15.667 11.5L22.667 7V20C22.667 20.5523 22.2193 21 21.667 21H1.66699C1.11471 21 0.666992 20.5523 0.666992 20V14.5Z"
          fill={colors[0]}
        />
        <path
          d="M0.666992 7.5L7.16699 2.5L17.167 6.5L22.667 1V7L15.667 11.5L0.666992 14.5V7.5Z"
          fill={colors[1]}
        />
      </g>
      <defs>
        <clipPath id="clip0_257_1019">
          <rect x="0.666992" width="22" height="22" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
