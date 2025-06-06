import type React from 'react';
import { DEFAULT_CHART_COLORS, DISABLED_CHART_COLORS } from './config';

export const ChartIcon_StackedColumn: React.FC<{ colors?: string[]; disabled?: boolean }> = ({
  colors: colorsProp = DEFAULT_CHART_COLORS,
  disabled
}) => {
  const colors = disabled ? DISABLED_CHART_COLORS : colorsProp;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 22 22"
      fill="none">
      <title>Stacked Column Chart Icon</title>
      <path
        d="M1.5 17C1.5 16.4477 1.94772 16 2.5 16H4.5C5.05228 16 5.5 16.4477 5.5 17V22H1.5V17Z"
        fill={colors[0]}
      />
      <path
        d="M1.5 12C1.5 11.4477 1.94772 11 2.5 11H4.5C5.05228 11 5.5 11.4477 5.5 12V14C5.5 14.5523 5.05228 15 4.5 15H2.5C1.94772 15 1.5 14.5523 1.5 14V12Z"
        fill={colors[1]}
      />
      <path
        d="M6.5 16C6.5 15.4477 6.94772 15 7.5 15H9.5C10.0523 15 10.5 15.4477 10.5 16V22H6.5V16Z"
        fill={colors[0]}
      />
      <path
        d="M6.5 6C6.5 5.44772 6.94772 5 7.5 5H9.5C10.0523 5 10.5 5.44772 10.5 6V13C10.5 13.5523 10.0523 14 9.5 14H7.5C6.94772 14 6.5 13.5523 6.5 13V6Z"
        fill={colors[1]}
      />
      <path
        d="M11.5 14C11.5 13.4477 11.9477 13 12.5 13H14.5C15.0523 13 15.5 13.4477 15.5 14V22H11.5V14Z"
        fill={colors[0]}
      />
      <path
        d="M11.5 10C11.5 9.44772 11.9477 9 12.5 9H14.5C15.0523 9 15.5 9.44772 15.5 10V11C15.5 11.5523 15.0523 12 14.5 12H12.5C11.9477 12 11.5 11.5523 11.5 11V10Z"
        fill={colors[1]}
      />
      <path
        d="M16.5 8C16.5 7.44772 16.9477 7 17.5 7H19.5C20.0523 7 20.5 7.44772 20.5 8V22H16.5V8Z"
        fill={colors[0]}
      />
      <path
        d="M16.5 1C16.5 0.447715 16.9477 0 17.5 0H19.5C20.0523 0 20.5 0.447715 20.5 1V5C20.5 5.55228 20.0523 6 19.5 6H17.5C16.9477 6 16.5 5.55228 16.5 5V1Z"
        fill={colors[1]}
      />
    </svg>
  );
};
