import type React from 'react';
import { DEFAULT_CHART_COLORS, DISABLED_CHART_COLORS } from '../config';

export const ChartIcon_Combo: React.FC<{ colors?: string[]; disabled?: boolean }> = ({
  colors: colorsProp = DEFAULT_CHART_COLORS,
  disabled
}) => {
  const colors = disabled ? DISABLED_CHART_COLORS : colorsProp;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
      <g clipPath="url(#clip0_257_883)">
        <path
          d="M1.5 2C1.5 1.44772 1.94772 1 2.5 1H4.5C5.05228 1 5.5 1.44772 5.5 2V21H1.5V2Z"
          fill={colors[1]}
        />
        <path
          d="M6.5 12C6.5 11.4477 6.94772 11 7.5 11H9.5C10.0523 11 10.5 11.4477 10.5 12V21H6.5V12Z"
          fill={colors[1]}
        />
        <path
          d="M11.5 6C11.5 5.44772 11.9477 5 12.5 5H14.5C15.0523 5 15.5 5.44772 15.5 6V21H11.5V6Z"
          fill={colors[1]}
        />
        <path
          d="M16.5 17C16.5 16.4477 16.9477 16 17.5 16H19.5C20.0523 16 20.5 16.4477 20.5 17V21H16.5V17Z"
          fill={colors[1]}
        />
        <path
          d="M21 3.5L14.0521 10.4479C13.7276 10.7724 13.224 10.8344 12.8305 10.5983L9.12161 8.37297C8.7508 8.15048 8.27898 8.19155 7.95218 8.47477L1 14.5"
          stroke={colors[0]}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_257_883">
          <rect width="22" height="22" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
