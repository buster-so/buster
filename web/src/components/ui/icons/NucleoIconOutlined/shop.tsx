import React from 'react';

import type { iconProps } from './iconProps';

function shop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shop';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75 16.25L3.75 9.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 9.5L14.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.668,1.75H4.331c-.359,0-.691,.193-.869,.505l-1.706,2.995c.475,1.031,1.51,1.75,2.72,1.75,.908,0,1.712-.412,2.262-1.049,.55,.637,1.354,1.049,2.262,1.049s1.711-.411,2.261-1.048c.55,.637,1.354,1.048,2.261,1.048,1.209,0,2.245-.719,2.72-1.75l-1.704-2.995c-.178-.312-.51-.505-.869-.505Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,16v-3c0-.966,.784-1.75,1.75-1.75h0c.966,0,1.75,.784,1.75,1.75v3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 16.25L16.25 16.25"
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

export default shop;
