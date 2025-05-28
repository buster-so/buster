import React from 'react';

import type { iconProps } from './iconProps';

function flame(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px flame';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6,11.25c1.105,0,2-.898,2-2.007,0-1.524-2-3.243-2-3.243,0,0-2,1.72-2,3.243,0,1.108.895,2.007,2,2.007Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6,11.25c2.209,0,4-1.789,4-3.995C10,4.22,6,.75,6,.75c0,0-4,3.47-4,6.505,0,2.206,1.791,3.995,4,3.995Z"
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

export default flame;
