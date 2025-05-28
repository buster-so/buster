import React from 'react';

import type { iconProps } from './iconProps';

function gasPump(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gas pump';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.25,15.75V4.25c0-1.105,.895-2,2-2h4.5c1.105,0,2,.895,2,2V15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 15.75L13.25 15.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25 8.75L11.75 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,4.25l2.207,2.207c.188,.188,.293,.442,.293,.707v4.586c0,.828-.672,1.5-1.5,1.5h0c-.828,0-1.5-.672-1.5-1.5v-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16,5.5v1.75c0,.552,.448,1,1,1h.25"
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

export default gasPump;
