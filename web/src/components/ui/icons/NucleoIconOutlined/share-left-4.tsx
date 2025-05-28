import React from 'react';

import type { iconProps } from './iconProps';

function shareLeft4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share left 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25,10.75v2.5c0,1.105-.895,2-2,2H2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 2.75L2.75 6 6 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3,6H7c2.347,0,4.25,1.903,4.25,4.25h0"
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

export default shareLeft4;
