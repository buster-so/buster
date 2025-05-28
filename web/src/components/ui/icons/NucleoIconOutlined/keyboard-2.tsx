import React from 'react';

import type { iconProps } from './iconProps';

function keyboard2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px keyboard 2';

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
          y="3.75"
        />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="6.875" y="8" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="4.125" y="8" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="9.625" y="8" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="12.375" y="8" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="5.5" y="6" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="8.25" y="6" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="11" y="6" />
        <path
          d="M11.25 11.25L6.75 11.25"
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

export default keyboard2;
