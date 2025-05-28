import React from 'react';

import type { iconProps } from './iconProps';

function link2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px link 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.75,11.25c0,1.105-.895,2-2,2H3.25c-1.105,0-2-.895-2-2V6.75c0-1.105,.895-2,2-2h2.5c1.105,0,2,.895,2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,6.75c0-1.105,.895-2,2-2h2.5c1.105,0,2,.895,2,2v4.5c0,1.105-.895,2-2,2h-2.5c-1.105,0-2-.895-2-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 9L12.25 9"
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

export default link2;
