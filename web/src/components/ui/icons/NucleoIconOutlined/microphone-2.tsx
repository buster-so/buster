import React from 'react';

import type { iconProps } from './iconProps';

function microphone2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px microphone 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.75,9.75v.75c0,2.623-2.127,4.75-4.75,4.75h0c-2.623,0-4.75-2.127-4.75-4.75v-.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25,7.25v-1.25c0-2.623,2.127-4.75,4.75-4.75h0c2.623,0,4.75,2.127,4.75,4.75v1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 15.25L9 17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 9.75L15.25 9.75"
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

export default microphone2;
