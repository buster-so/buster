import React from 'react';

import type { iconProps } from './iconProps';

function undo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px undo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3,10c.528-.461,2.7-2.251,6-2.251s5.472,1.79,6,2.251"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.625 5.598L3 10 7.53 11.222"
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

export default undo;
