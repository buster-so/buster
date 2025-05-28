import React from 'react';

import type { iconProps } from './iconProps';

function clock2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clock 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="4" fill="currentColor" r=".75" />
        <circle cx="14" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="14" fill="currentColor" r=".75" />
        <circle cx="4" cy="9" fill="currentColor" r=".75" />
        <path
          d="M6.75 6.75L9 9 12.5 5.5"
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

export default clock2;
