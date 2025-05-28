import React from 'react';

import type { iconProps } from './iconProps';

function keyboard2Wireless(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px keyboard 2 wireless';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="10.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="6.75"
        />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="6.875" y="11" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="4.125" y="11" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="9.625" y="11" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="12.375" y="11" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="5.5" y="9" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="8.25" y="9" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="11" y="9" />
        <path
          d="M11.25 14.25L6.75 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.939,4.189c.586-.586,1.536-.586,2.121,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.818,2.068c1.757-1.757,4.607-1.757,6.364,0"
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

export default keyboard2Wireless;
