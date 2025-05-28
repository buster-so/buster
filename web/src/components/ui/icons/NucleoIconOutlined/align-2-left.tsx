import React from 'react';

import type { iconProps } from './iconProps';

function align2Left(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px align 2 left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75 16.25L2.75 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="9.5"
          width="4.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 10.5 9)"
          x="8.25"
          y="4.25"
        />
      </g>
    </svg>
  );
}

export default align2Left;
