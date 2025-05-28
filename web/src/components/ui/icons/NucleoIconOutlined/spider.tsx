import React from 'react';

import type { iconProps } from './iconProps';

function spider(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px spider';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 2.25L9 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6.442,10.5l-2.78-1.741c-.26-.163-.431-.437-.464-.743l-.449-4.266"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.917,11.75l-2.215,1.454c-.282.185-.451.499-.451.836v2.21"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.016,11.25h-2.777c-.309,0-.6.142-.789.386l-1.45,1.864"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m11.558,10.5l2.78-1.741c.26-.163.431-.437.464-.743l.449-4.266"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.083,11.75l2.215,1.454c.282.185.451.499.451.836v2.21"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.984,11.25h2.777c.309,0,.6.142.789.386l1.45,1.864"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="8.5"
          fill="none"
          r="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="14.5" fill="currentColor" r="1.5" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default spider;
