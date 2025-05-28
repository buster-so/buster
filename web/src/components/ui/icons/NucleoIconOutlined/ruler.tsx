import React from 'react';

import type { iconProps } from './iconProps';

function ruler(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ruler';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.298 11.298L9.53 9.53"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.066 9.53L12.005 8.47"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.53 13.066L8.47 12.005"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.763 14.834L5.995 13.066"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12" cy="4.75" fill="currentColor" r=".75" />
        <rect
          height="6.5"
          width="15"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-45 9 9)"
          x="1.5"
          y="5.75"
        />
      </g>
    </svg>
  );
}

export default ruler;
