import React from 'react';

import type { iconProps } from './iconProps';

function messageSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px message sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,9.66V4.25c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v7c0,1.104,.895,2,2,2h2v3l2.673-2.138"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 10.25L14.75 12.25 16.75 13.25 14.75 14.25 13.75 16.25 12.75 14.25 10.75 13.25 12.75 12.25 13.75 10.25z"
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

export default messageSparkle;
