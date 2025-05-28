import React from 'react';

import type { iconProps } from './iconProps';

function flag2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px flag 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.75,1.75h7c.276,0,.5.224.5.5v4.5c0,.276-.224.5-.5.5H2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 0.75L2.75 11.25"
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

export default flag2;
