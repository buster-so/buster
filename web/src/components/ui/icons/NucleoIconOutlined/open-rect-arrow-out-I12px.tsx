import React from 'react';

import type { iconProps } from './iconProps';

function openRectArrowOut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px open rect arrow out';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1 6L7 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25 3.5L0.75 6 3.25 8.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6.75,11.25h2.5c1.105,0,2-.895,2-2V2.75c0-1.105-.895-2-2-2h-2.5"
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

export default openRectArrowOut;
