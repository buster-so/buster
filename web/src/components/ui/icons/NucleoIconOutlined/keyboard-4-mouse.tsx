import React from 'react';

import type { iconProps } from './iconProps';

function keyboard4Mouse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px keyboard 4 mouse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.75,12.25H3.75c-1.105,0-2-.895-2-2V5.75c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 9.25L6.75 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 12.25L13.75 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="6.875" y="6" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="4.125" y="6" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="9.625" y="6" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="12.375" y="6" />
        <rect
          height="7.5"
          width="5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.25"
          y="8.75"
        />
      </g>
    </svg>
  );
}

export default keyboard4Mouse;
