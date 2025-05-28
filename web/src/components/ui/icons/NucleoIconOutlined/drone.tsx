import React from 'react';

import type { iconProps } from './iconProps';

function drone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px drone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.25 1.75L4.25 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25 2.75L7.25 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 1.75L13.75 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 2.75L16.75 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,12.25l.25-3h2c.966,0,1.75-.783,1.75-1.75s-.784-1.75-1.75-1.75H4c-.966,0-1.75,.783-1.75,1.75s.784,1.75,1.75,1.75h2l.25,3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,16.25c0-2.209-1.791-4-4-4H6.25c-2.209,0-4,1.791-4,4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default drone;
