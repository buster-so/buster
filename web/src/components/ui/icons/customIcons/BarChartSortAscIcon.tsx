import type React from 'react';

export const BarChartSortAscIcon: React.FC<{
  color?: string;
  'data-value'?: string;
}> = ({ color = '#575859', 'data-value': dataValue }) => {
  return (
    <svg
      {...(dataValue ? { 'data-value': dataValue } : {})}
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none">
      <path
        d="M6.60547 9.9375L6.60542 5.125"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.23047 9.9375V6.875"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.98047 9.9375V2.9375"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.10543 3.15625H4.91797M2.10543 3.15625C2.10543 3.46259 2.97794 4.03497 3.19918 4.25M2.10543 3.15625C2.10543 2.84991 2.97794 2.27753 3.19918 2.0625"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
