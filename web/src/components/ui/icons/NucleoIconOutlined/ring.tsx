import React from 'react';

import type { iconProps } from './iconProps';

function ring(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ring';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.633,4.262l-1.85-2.456,.994-1.057h2.446l.994,1.057-1.85,2.456"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9.75"
          fill="none"
          r="5.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default ring;
