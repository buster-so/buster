import React from 'react';

import type { iconProps } from './iconProps';

function arrowDoorOut2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow door out 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.75 6L11 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 8.25L11.25 6 9 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.23,1.15l2.16,1.8c.228.19.36.471.36.768v4.563c0,.297-.132.578-.36.768l-2.16,1.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.224,10.008c-.123.705-.734,1.242-1.474,1.242h-3.5c-.828,0-1.5-.672-1.5-1.5V2.25c0-.828.672-1.5,1.5-1.5h3.5c.74,0,1.351.537,1.474,1.242"
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

export default arrowDoorOut2;
