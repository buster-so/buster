import React from 'react';

import type { iconProps } from './iconProps';

function sidebarLeft3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sidebar left 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,2.75h5.25c1.105,0,2,.895,2,2V13.25c0,1.105-.895,2-2,2h-5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,15.25H3.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h2.5V15.25Z"
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

export default sidebarLeft3;
