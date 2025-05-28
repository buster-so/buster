import React from 'react';

import type { iconProps } from './iconProps';

function trainer(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px trainer';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="3.25"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,14.5l2.708-2.321c.432-.37,.468-1.026,.08-1.442l-2.195-2.352c-.378-.405-.908-.635-1.462-.635h-1.881s-1.881,0-1.881,0c-.554,0-1.084,.23-1.462,.635l-2.195,2.352c-.388,.416-.352,1.071,.08,1.442l2.708,2.321"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25 16.25L6.25 7.949"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 16.25L11.75 7.949"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75 10.75L11.75 10.75"
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

export default trainer;
