import type React from 'react';

export const BarChartSortDescIcon: React.FC<{
  color?: string;
  'data-value'?: string;
}> = ({ color = '#575859', 'data-value': dataValue }) => {
  return (
    <svg
      {...(dataValue ? { 'data-value': dataValue } : {})}
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="12"
      viewBox="0 0 11 12"
      fill="none">
      <title>Bar Chart Sort Desc Icon</title>
      <g clipPath="url(#clip0_285_720)">
        <path
          d="M5.14648 9.9375L5.14653 5.125"
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.52148 9.9375V6.875"
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M1.77148 9.9375L1.77148 2.9375"
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.64652 3.15625H6.83398M9.64652 3.15625C9.64652 3.46259 8.77401 4.03497 8.55277 4.25M9.64652 3.15625C9.64652 2.84991 8.77401 2.27753 8.55277 2.0625"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_285_720">
          <rect
            width="10.5"
            height="10.5"
            fill="white"
            transform="matrix(0 -1 1 0 0.458984 11.25)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};
