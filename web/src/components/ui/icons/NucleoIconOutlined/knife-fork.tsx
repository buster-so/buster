import React from 'react';

import type { iconProps } from './iconProps';

function knifeFork(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px knife fork';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75,15.75V2.25c-.483,.718-.999,1.621-1.438,2.708-.817,2.029-1.028,3.866-1.062,5.147l2.5,2.145"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 2.25L11.75 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,2.25l.144,3.752c.058,1.5-1.143,2.748-2.644,2.748h0c-1.501,0-2.702-1.248-2.644-2.748l.144-3.752"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 8.75L11.75 15.75"
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

export default knifeFork;
