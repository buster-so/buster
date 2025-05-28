import React from 'react';

import type { iconProps } from './iconProps';

function moonCloudSnow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px moon cloud snow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.341,7.172c.383-.469,.661-1.027,.801-1.638-.288,.066-.584,.108-.892,.108-2.209,0-4-1.791-4-4,0-.308,.042-.604,.108-.892-1.778,.406-3.108,1.991-3.108,3.892,0,.828,.252,1.598,.683,2.236"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25,14.25h.5c1.381,0,2.5-1.119,2.5-2.5s-1.119-2.5-2.5-2.5c-.413,0-.797,.11-1.14,.287-.427-1.602-1.874-2.787-3.61-2.787s-3.182,1.186-3.61,2.787c-.343-.177-.727-.287-1.14-.287-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.585,10.499c.239-.413,.594-.752,1.02-.972"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 12.25L8.75 17.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.585 13.5L10.915 16"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.585 16L10.915 13.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default moonCloudSnow;
