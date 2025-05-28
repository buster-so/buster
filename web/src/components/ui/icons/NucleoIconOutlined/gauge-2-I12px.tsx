import React from 'react';

import type { iconProps } from './iconProps';

function gauge2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px gauge 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m.987,4.522c-.139.472-.237.961-.237,1.478,0,2.899,2.351,5.25,5.25,5.25s5.25-2.351,5.25-5.25S8.899.75,6,.75c-.517,0-1.006.098-1.478.237"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 6L2 2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6"
          cy="6"
          fill="currentColor"
          r=".75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default gauge2;
