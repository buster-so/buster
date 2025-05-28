import React from 'react';

import type { iconProps } from './iconProps';

function applications(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px applications';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75,10.25V4.75h-3.5c-1.105,0-2,.895-2,2v7c0,1.105,.895,2,2,2h7c1.105,0,2-.895,2-2v-3.5H7.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,1.75h3.5c1.104,0,2,.896,2,2v3.5h-5.5V1.75h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25 10.25L7.75 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 15.75L7.75 10.25"
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

export default applications;
