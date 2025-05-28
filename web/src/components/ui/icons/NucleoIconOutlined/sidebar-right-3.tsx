import React from 'react';

import type { iconProps } from './iconProps';

function sidebarRight3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sidebar right 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,2.75H3.75c-1.105,0-2,.895-2,2V13.25c0,1.105,.895,2,2,2h5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,15.25h2.5c1.105,0,2-.895,2-2V4.75c0-1.105-.895-2-2-2h-2.5s0,12.5,0,12.5Z"
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

export default sidebarRight3;
