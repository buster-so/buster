import React from 'react';

import type { iconProps } from './iconProps';

function toggle2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px toggle 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6.5,3.75h5c2.8995,0,5.25,2.3505,5.25,5.25h0c0,2.8995-2.3505,5.25-5.25,5.25h-5c-2.8995,0-5.25-2.3505-5.25-5.25h0c0-2.8995,2.3505-5.25,5.25-5.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6.5"
          cy="9"
          fill="currentColor"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default toggle2;
