import React from 'react';

import type { iconProps } from './iconProps';

function versions2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px versions 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25,11.25h-1.5c-1.105,0-2-.895-2-2V3.75c0-1.105,.895-2,2-2h3.5c1.105,0,2,.895,2,2v.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75,13.75h-1.5c-1.105,0-2-.895-2-2V6.25c0-1.105,.895-2,2-2h3.5c1.105,0,2,.895,2,2v.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="9.5"
          width="7.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 12.5 11.5)"
          x="8.75"
          y="6.75"
        />
      </g>
    </svg>
  );
}

export default versions2;
