import React from 'react';

import type { iconProps } from './iconProps';

function sideProfileChat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px side profile chat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.768,3.982c-.452-.452-1.077-.732-1.768-.732-.69,0-1.315,.28-1.768,.732"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.536,2.214c-.905-.905-2.155-1.464-3.536-1.464-1.381,0-2.631,.56-3.536,1.464"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,17.25v-2.5h1.639c1.049,0,1.919-.81,1.995-1.856l.112-1.543,1.504-.601-1.5-2c0-2.796-1.912-5.145-4.5-5.811"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,17.25v-2.5h-1.639c-1.049,0-1.919-.81-1.995-1.856l-.112-1.543-1.504-.601,1.5-2c0-2.796,1.912-5.145,4.5-5.811"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="2.75" cy="8.25" r=".75" />
        <circle cx="9" cy="5.75" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="8.25" r=".75" />
      </g>
    </svg>
  );
}

export default sideProfileChat;
