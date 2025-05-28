import React from 'react';

import type { iconProps } from './iconProps';

function squareCheck3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square check 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.5,9c.863,.867,1.537,1.868,2.1,2.962,1.307-2.491,2.94-4.466,4.9-5.923"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default squareCheck3;
