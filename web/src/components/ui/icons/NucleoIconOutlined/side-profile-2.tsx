import React from 'react';

import type { iconProps } from './iconProps';

function sideProfile2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px side profile 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.25,16.25v-2.5h1.639c1.049,0,1.919-.81,1.995-1.856l.112-1.543,1.504-.601-1.5-2c0-2.796-1.912-5.145-4.5-5.811"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,16.25v-2.5h-1.639c-1.049,0-1.919-.81-1.995-1.856l-.112-1.543-1.504-.601,1.5-2c0-2.796,1.912-5.145,4.5-5.811"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.25" cy="7.25" fill="currentColor" r=".75" />
        <circle cx="14.75" cy="7.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default sideProfile2;
