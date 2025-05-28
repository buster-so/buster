import React from 'react';

import type { iconProps } from './iconProps';

function sphere2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sphere 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,9c0,1.657-3.246,3-7.25,3s-7.25-1.343-7.25-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.972,1.778c1.657,0,3,3.246,3,7.25s-1.343,7.25-3,7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
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
      </g>
    </svg>
  );
}

export default sphere2;
