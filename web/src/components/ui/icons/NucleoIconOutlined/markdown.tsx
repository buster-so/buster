import React from 'react';

import type { iconProps } from './iconProps';

function markdown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px markdown';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="10.5"
          width="16.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y="3.75"
        />
        <path
          d="M8.75 11.25L8.75 6.75 8.356 6.75 6.25 9.5 4.144 6.75 3.75 6.75 3.75 11.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5 9.5L13.25 11.25 15 9.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 11.25L13.25 6.75"
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

export default markdown;
