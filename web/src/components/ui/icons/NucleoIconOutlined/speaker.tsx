import React from 'react';

import type { iconProps } from './iconProps';

function speaker(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px speaker';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="14.5"
          width="10.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y="1.75"
        />
        <circle
          cx="9"
          cy="11"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="5.5" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default speaker;
