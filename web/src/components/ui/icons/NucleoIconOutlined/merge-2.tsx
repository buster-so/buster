import React from 'react';

import type { iconProps } from './iconProps';

function merge2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px merge 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,13.75h3.5c1.105,0,2-.895,2-2v-2.75s0-2.75,0-2.75c0-1.105-.895-2-2-2H2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 9L8.25 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.5 6.25L16.25 9 13.5 11.75"
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

export default merge2;
