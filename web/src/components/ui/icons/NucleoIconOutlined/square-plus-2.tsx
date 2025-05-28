import React from 'react';

import type { iconProps } from './iconProps';

function squarePlus2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square plus 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.75 0.75L14.75 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.8004,2.75h-5.0504c-1.1046,0-2,.8955-2,2v8.5c0,1.1045.8954,2,2,2h8.5c1.1046,0,2-.8955,2-2v-5.0503"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25 3.25L12.25 3.25"
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

export default squarePlus2;
