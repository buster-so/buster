import React from 'react';

import type { iconProps } from './iconProps';

function userAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="4.5"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="13" cy="17.25" fill="currentColor" r=".75" />
        <path
          d="M9.389,9.779c-.13-.008-.257-.029-.389-.029-2.551,0-4.739,1.53-5.709,3.72-.365,.825,.087,1.774,.947,2.045,.686,.217,1.509,.413,2.426,.551"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.5,16.25h.433c.788,0,1.267-.869,.845-1.535l-2.933-4.631c-.393-.62-1.297-.62-1.69,0l-2.933,4.631c-.422,.666,.057,1.535,.845,1.535h.433"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13 12.75L13 14.75"
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

export default userAlert;
