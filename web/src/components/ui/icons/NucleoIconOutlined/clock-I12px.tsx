import React from 'react';

import type { iconProps } from './iconProps';

function clock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="5.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6,3.25v2.75l2,1.75"
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

export default clock;
