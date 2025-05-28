import React from 'react';

import type { iconProps } from './iconProps';

function screenSharing(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px screen sharing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,2.75h5.25c1.105,0,2,.895,2,2v6.5c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2v-1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,16.25c.758-.239,1.878-.5,3.25-.5,.795,0,1.941,.088,3.25,.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 13.25L9 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 7.25L1.75 2.75 6.25 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 3L7.25 8.25"
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

export default screenSharing;
