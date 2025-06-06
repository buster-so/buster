import type React from 'react';

export const LineChartDotLineIcon: React.FC<{
  'data-value'?: string;
  color?: string;
}> = ({ 'data-value': dataValue, color = 'currentColor' }) => {
  return (
    <svg
      {...(dataValue ? { 'data-value': dataValue } : {})}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none">
      <title>Line Chart Dot Line Icon</title>
      <g clipPath="url(#clip0_93_11356)">
        <mask id="mask0_93_11356" maskUnits="userSpaceOnUse" x="-2" y="-2" width="20" height="20">
          <rect x="-2" y="-2" width="20" height="20" fill="#D9D9D9" />
        </mask>
        <g mask="url(#mask0_93_11356)">
          <path
            d="M1.5 12.5005L0.5 11.5005L6 6.00016L9.27083 9.25016L14.5 3.50049L15.5 4.50049L9.33333 11.4585L6 8.12516L1.5 12.5005Z"
            fill={color}
          />
        </g>
        <path
          d="M10.833 10.3662C10.833 11.1946 10.1614 11.8662 9.33301 11.8662C8.50458 11.8662 7.83301 11.1946 7.83301 10.3662C7.83301 9.53778 8.50458 8.86621 9.33301 8.86621C10.1614 8.86621 10.833 9.53778 10.833 10.3662Z"
          fill={color}
        />
        <path
          d="M3 11.5C3 12.3284 2.32843 13 1.5 13C0.671573 13 0 12.3284 0 11.5C0 10.6716 0.671573 10 1.5 10C2.32843 10 3 10.6716 3 11.5Z"
          fill={color}
        />
        <path
          d="M16 4.49951C16 5.32794 15.3284 5.99951 14.5 5.99951C13.6716 5.99951 13 5.32794 13 4.49951C13 3.67108 13.6716 2.99951 14.5 2.99951C15.3284 2.99951 16 3.67108 16 4.49951Z"
          fill={color}
        />
        <path
          d="M7.50098 7.50049C7.50098 8.32892 6.8294 9.00049 6.00098 9.00049C5.17255 9.00049 4.50098 8.32892 4.50098 7.50049C4.50098 6.67206 5.17255 6.00049 6.00098 6.00049C6.8294 6.00049 7.50098 6.67206 7.50098 7.50049Z"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip0_93_11356">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
