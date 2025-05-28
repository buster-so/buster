import React from 'react';

import type { iconProps } from './iconProps';

function boxArchive3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box archive 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75 4.75L5 1.75 13 1.75 15.25 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.75,4.75h12.5v9.5c0,1.104-.896,2-2,2H4.75c-1.104,0-2-.896-2-2V4.75h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11 7.75L7 7.75"
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

export default boxArchive3;
