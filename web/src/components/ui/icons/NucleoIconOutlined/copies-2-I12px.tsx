import React from 'react';

import type { iconProps } from './iconProps';

function copies2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px copies 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="10.5"
          width="7"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 6 7.25)"
          x="2.5"
          y="2"
        />
        <path
          d="M9.25 0.75L2.75 0.75"
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

export default copies2;
