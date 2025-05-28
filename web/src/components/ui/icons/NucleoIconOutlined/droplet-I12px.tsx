import React from 'react';

import type { iconProps } from './iconProps';

function droplet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px droplet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6,11.25c2.209,0,4-1.789,4-3.995,0-3.035-2.242-4.333-4-6.505-1.758,2.172-4,3.47-4,6.505,0,2.206,1.791,3.995,4,3.995Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6,8.75c-.827,0-1.5-.671-1.5-1.495"
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

export default droplet;
