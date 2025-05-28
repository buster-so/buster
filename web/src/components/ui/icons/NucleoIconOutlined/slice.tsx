import React from 'react';

import type { iconProps } from './iconProps';

function slice(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px slice';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.206,6.294L1.25,15.25c3.344,.25,6.125-.781,7.75-2.5l-.253-1.702,1.546-1.546"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.206,6.294l3.578-3.578c.621-.621,1.629-.621,2.25,0h0c.621,.621,.621,1.629,0,2.25l-3.578,3.578-2.25-2.25Z"
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

export default slice;
