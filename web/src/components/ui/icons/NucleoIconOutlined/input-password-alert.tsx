import React from 'react';

import type { iconProps } from './iconProps';

function inputPasswordAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px input password alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="5.5" cy="9" fill="currentColor" r="1" />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
        <circle cx="13" cy="16.75" fill="currentColor" r=".75" />
        <path
          d="M16.25,9.209v-2.459c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v4.5c0,1.104,.895,2,2,2h3.441"
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

export default inputPasswordAlert;
