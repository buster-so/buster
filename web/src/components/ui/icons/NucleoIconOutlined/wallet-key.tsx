import React from 'react';

import type { iconProps } from './iconProps';

function walletKey(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wallet key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.75,15.25h3c.552,0,1-.448,1-1V7.75c0-.552-.448-1-1-1H4.25c-1.105,0-2-.895-2-2v4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25,4.75c0-1.105,.895-2,2-2H12.75c.552,0,1,.448,1,1v.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 13.75L9.25 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 13.75L7.75 15.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12.75" cy="11" fill="currentColor" r="1.25" />
        <circle
          cx="3"
          cy="13.75"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default walletKey;
