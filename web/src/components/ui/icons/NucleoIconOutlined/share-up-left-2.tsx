import React from 'react';

import type { iconProps } from './iconProps';

function shareUpLeft2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share up left 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.5 2.75L2.75 2.75 2.75 7.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 2.75L9 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,10.5v2.75c0,1.105,.895,2,2,2h6.5c1.105,0,2-.895,2-2V6.75c0-1.105-.895-2-2-2h-2.75"
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

export default shareUpLeft2;
