import React from 'react';

import type { iconProps } from './iconProps';

function storage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px storage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <ellipse
          cx="6"
          cy="2.75"
          fill="none"
          rx="4.25"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.25,9.25c0,1.105-1.903,2-4.25,2s-4.25-.895-4.25-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.25,6c0,1.105-1.903,2-4.25,2s-4.25-.895-4.25-2"
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

export default storage;
