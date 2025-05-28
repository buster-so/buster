import type React from 'react';

export const LineChartAreaChartIcon: React.FC<{
  'data-value'?: string;
  color?: string;
}> = ({ 'data-value': dataValue, color = 'currentColor' }) => {
  return (
    <svg
      {...(dataValue ? { 'data-value': dataValue } : {})}
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none">
      <mask id="mask0_385_399" maskUnits="userSpaceOnUse" x="-2" y="-2" width="21" height="20">
        <rect x="-1.29102" y="-2" width="20" height="20" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_385_399)">
        <path
          d="M1.70898 14V10L6.20898 4.5L10.709 6.5L15.709 0.5V14H1.70898ZM3.20898 12.5H14.209V5L11.209 8.5L6.70898 6.5L3.20898 11V12.5Z"
          fill={color}
        />
      </g>
    </svg>
  );
};
