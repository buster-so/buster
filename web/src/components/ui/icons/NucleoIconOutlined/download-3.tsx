import React from 'react';

import type { iconProps } from './iconProps';

function download3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px download 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12,6.75h1.75c1.105,0,2,.895,2,2v5c0,1.105-.895,2-2,2H4.25c-1.105,0-2-.895-2-2v-5c0-1.105,.895-2,2-2h1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12 9.75L9 12.75 6 9.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 12.75L9 1.25"
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

export default download3;
