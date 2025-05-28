import React from 'react';

import type { iconProps } from './iconProps';

function repeat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px repeat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5,13.75h-.75c-1.105,0-2-.895-2-2V6.25c0-1.105,.895-2,2-2H13.75c1.105,0,2,.895,2,2v5.5c0,1.105-.895,2-2,2h-5.742"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.5 11.25L8.008 13.742 10.5 16.235"
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

export default repeat;
