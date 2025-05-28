import type React from 'react';
import { DEFAULT_CHART_COLORS, DISABLED_CHART_COLORS } from '../config';

export const ChartIcon_Line: React.FC<{ colors?: string[]; disabled?: boolean }> = ({
  colors: colorsProp = DEFAULT_CHART_COLORS,
  disabled
}) => {
  const colors = disabled ? DISABLED_CHART_COLORS : colorsProp;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="23" height="22" viewBox="0 0 23 22" fill="none">
      <title>Line Chart Icon</title>
      <g clipPath="url(#clip0_257_835)">
        <path
          d="M21.6669 13.9999L14.2354 16.7873C13.8859 16.9183 13.4926 16.8439 13.2152 16.5943L9.37188 13.1353C8.97655 12.7795 8.37189 12.7954 7.99581 13.1715L1.66668 19.5006"
          stroke={colors[0]}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M21.6674 2.50007L14.3377 10.2879C13.9651 10.6838 13.3445 10.7095 12.9405 10.3458L9.3726 7.13474C8.97727 6.77894 8.37261 6.79484 7.99653 7.17093L1.6674 13.5001"
          stroke={colors[1]}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_257_835">
          <rect width="22" height="22" fill="white" transform="translate(0.666992)" />
        </clipPath>
      </defs>
    </svg>
  );
};
