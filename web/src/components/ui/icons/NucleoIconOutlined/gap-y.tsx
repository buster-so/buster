import React from 'react';

import type { iconProps } from './iconProps';

function gapY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gap y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.75,15.25v-1c0-1.105.895-2,2-2h8.5c1.105,0,2,.895,2,2v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.75,2.75v1c0,1.105.895,2,2,2h8.5c1.105,0,2-.895,2-2v-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 9L6.75 9"
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

export default gapY;
