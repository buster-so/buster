import React from 'react';

import type { iconProps } from './iconProps';

function users5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="5"
          cy="7.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="12.5"
          cy="4"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.217,10.686c.639-1.155,1.87-1.936,3.283-1.936h0c2.071,0,3.75,1.679,3.75,3.75v2.75c0,.552-.448,1-1,1h-4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5,11.75h0c1.794,0,3.25,1.456,3.25,3.25v.25c0,.552-.448,1-1,1H2.75c-.552,0-1-.448-1-1v-.25c0-1.794,1.456-3.25,3.25-3.25Z"
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

export default users5;
