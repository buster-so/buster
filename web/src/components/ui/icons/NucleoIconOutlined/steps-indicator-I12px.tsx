import React from 'react';

import type { iconProps } from './iconProps';

function stepsIndicator(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px steps indicator';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M0.75 6L2.75 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25 6L11.25 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="6" fill="currentColor" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default stepsIndicator;
