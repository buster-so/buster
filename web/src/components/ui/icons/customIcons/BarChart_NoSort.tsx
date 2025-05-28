import type React from 'react';

export const BarChartSortNoneIcon: React.FC<{
  'data-value'?: string;
}> = ({ 'data-value': dataValue }) => {
  return (
    <svg
      {...(dataValue ? { 'data-value': dataValue } : {})}
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="12"
      viewBox="0 0 11 12"
      fill="none">
      <path
        d="M8.62598 9.9375L8.62593 5.125M1.87598 9.9375V6.875M5.25098 9.9375V2.9375"
        stroke="#575859"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
