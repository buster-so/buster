import type React from 'react';
import { DEFAULT_CHART_COLORS, DISABLED_CHART_COLORS } from './config';

export const ChartIcon_AreaRelative: React.FC<{ colors?: string[]; disabled?: boolean }> = ({
  colors: colorsProp = DEFAULT_CHART_COLORS,
  disabled
}) => {
  const colors = disabled ? DISABLED_CHART_COLORS : colorsProp;
  const firstColor = colors[0] || '#575859';
  const secondColor = colors[1] || '#575859';
  const thirdColor = colors[2] || '#575859';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 22 22"
      fill="none">
      <title>Area Relative Chart Icon</title>
      <path
        d="M0 17.8889L7 15L16 17L22 15V20C22 20.5523 21.5523 21 21 21H1C0.447716 21 0 20.5523 0 20V17.8889Z"
        fill={firstColor}
      />
      <path d="M0 9L7 10.5L16 3L22 5V15L16 17L7 15L0 18V9Z" fill={secondColor} />
      <path
        d="M0 2C0 1.44772 0.447715 1 1 1H21C21.5523 1 22 1.44772 22 2V5L16 3L7 10.5L0 9V2Z"
        fill={thirdColor}
      />
    </svg>
  );
};
