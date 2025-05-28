import React from 'react';

import type { iconProps } from './iconProps';

function boxArchive(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px box archive';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.25,4.5v4.25c0,1.105-.895,2-2,2h-2.25s-2.25,0-2.25,0c-1.105,0-2-.895-2-2v-4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5 6.75L7 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="10.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y="1.25"
        />
      </g>
    </svg>
  );
}

export default boxArchive;
