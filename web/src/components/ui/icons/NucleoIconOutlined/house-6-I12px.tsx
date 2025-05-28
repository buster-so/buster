import React from 'react';

import type { iconProps } from './iconProps';

function house6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px house 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M0.75 3.798L6 0.75 11.25 3.798"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 10.75L6 8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.25,5.798v3.952c0,.552-.448,1-1,1H2.75c-.552,0-1-.448-1-1v-3.952"
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

export default house6;
