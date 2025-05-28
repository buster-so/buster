import React from 'react';

import type { iconProps } from './iconProps';

function gamingBlocks(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gaming blocks';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75,1.25h3.25c.552,0,1,.448,1,1V6.25H3.75V2.25c0-.552,.448-1,1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,11.75h5.25v4c0,.552-.448,1-1,1h-3.25c-.552,0-1-.448-1-1v-4h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,6.25h5.25v5.5H4.75c-.552,0-1-.448-1-1V6.25h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,6.25h4.25c.552,0,1,.448,1,1v4.5h-5.25V6.25h0Z"
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

export default gamingBlocks;
