import React from 'react';

import type { iconProps } from './iconProps';

function copy2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px copy 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75,12.25h-1c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h7.5c1.105,0,2,.895,2,2v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="9.5"
          width="11.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 10.5 10.5)"
          x="4.75"
          y="5.75"
        />
      </g>
    </svg>
  );
}

export default copy2;
