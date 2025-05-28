import React from 'react';

import type { iconProps } from './iconProps';

function screenReader(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px screen reader';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m15.75,7.8134v-3.0634c0-1.105-.895-2-2-2H3.75c-1.105,0-2,.895-2,2v8.5c0,1.105.895,2,2,2h.7923"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.25,11.75h2l3-2.25v7.5l-3-2.25h-2c-.552,0-1-.448-1-1v-1c0-.552.448-1,1-1Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.75,10.813c.757.545,1.25,1.433,1.25,2.437s-.493,1.892-1.25,2.437"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5 5.75L11.25 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5 8.75L8.75 8.75"
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

export default screenReader;
