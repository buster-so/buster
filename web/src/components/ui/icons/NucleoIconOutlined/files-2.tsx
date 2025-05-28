import React from 'react';

import type { iconProps } from './iconProps';

function files2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px files 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25,10.75H3.25c-.552,0-1-.448-1-1V2.75c0-.552,.448-1,1-1H7.25l2,2v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 1.75L6.75 3.75 8.75 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,9.25v6c0,.552-.448,1-1,1h-5c-.552,0-1-.448-1-1v-7c0-.552,.448-1,1-1h4l2,2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 7.25L13.75 9.25 15.75 9.25"
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

export default files2;
