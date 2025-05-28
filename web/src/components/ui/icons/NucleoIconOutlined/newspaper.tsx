import React from 'react';

import type { iconProps } from './iconProps';

function newspaper(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px newspaper';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.5,16.25h0c-.966,0-1.75-.784-1.75-1.75v-4.25c0-.276,.224-.5,.5-.5h.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,14.5c0,.966-.784,1.75-1.75,1.75H14.25c1.105,0,2-.895,2-2V3.75c0-1.105-.895-2-2-2H7.25c-1.105,0-2,.895-2,2V14.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 4.75H13.25V7.25H8.25z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 10.25L8.25 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 13.25L8.25 13.25"
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

export default newspaper;
