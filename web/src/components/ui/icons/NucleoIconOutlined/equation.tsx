import React from 'react';

import type { iconProps } from './iconProps';

function equation(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px equation';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.667,9.75c2.75,0,2.2,5.5,4.95,5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.167,9.75c-2.75,0-3.3,5.5-6.6,5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 2.75L10.5 2.75 5.75 15.25 3.683 10.75 1.75 10.75"
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

export default equation;
