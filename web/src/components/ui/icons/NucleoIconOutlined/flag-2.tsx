import React from 'react';

import type { iconProps } from './iconProps';

function flag2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flag 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,3.25H13.25c.552,0,1,.448,1,1v5c0,.552-.448,1-1,1H3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 1.75L3.75 16.25"
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

export default flag2;
