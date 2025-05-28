import React from 'react';

import type { iconProps } from './iconProps';

function moonCloudHail(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px moon cloud hail';

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
          d="M14.418,14.16c1.056-.292,1.832-1.261,1.832-2.41,0-1.381-1.119-2.5-2.5-2.5-.413,0-.797,.11-1.14,.287-.427-1.602-1.874-2.787-3.61-2.787-1.736,0-3.182,1.186-3.61,2.787-.343-.177-.727-.287-1.14-.287-1.381,0-2.5,1.119-2.5,2.5,0,1.149,.775,2.117,1.832,2.41"
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
        <circle cx="11.75" cy="17.25" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="17.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="15.75" fill="currentColor" r=".75" />
        <circle cx="11.75" cy="14.25" fill="currentColor" r=".75" />
        <circle cx="6.25" cy="14.25" fill="currentColor" r=".75" />
        <circle cx="9" cy="12.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default moonCloudHail;
