import React from 'react';

import type { iconProps } from './iconProps';

function keyboard4HideDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px keyboard 4 hide down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="8.5"
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
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="6.875" y="6" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="4.125" y="6" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="9.625" y="6" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="12.375" y="6" />
        <path
          d="M11.25 9.25L6.75 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5 14.75L9 17.25 6.5 14.75"
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

export default keyboard4HideDown;
